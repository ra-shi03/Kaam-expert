import cron from 'node-cron'
import { Booking } from '../models/Booking.js'
import { BroadcastLog } from '../models/BroadcastLog.js'
import { WorkforceRequest } from '../models/WorkforceRequest.js'
import { startBroadcastCycle, getBroadcastTimeoutMs, activeBroadcastTimeouts } from '../services/broadcastService.js'
import { emitToUser, getIo } from '../socket.js'
import { User } from '../models/User.js'
import { SystemSetting } from '../models/SystemSetting.js'

// Alias for readability — this is the shared set from broadcastService
const activeTimeouts = activeBroadcastTimeouts

export function initBroadcastCron() {
  // Run every 30 seconds for precise 1-hour broadcast triggering
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date()

      // ===== 1. STUCK BROADCAST CLEANUP =====
      // Instant flash offers expire in 5 min — only fail those after 7 min.
      // Scheduled bookings stay BROADCASTING until 10 min AFTER scheduledAt.
      const sevenMinsAgo = new Date(now.getTime() - 7 * 60 * 1000)
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000)
      
      const stuck = await Booking.updateMany(
        {
          status: 'BROADCASTING',
          $or: [
            { type: 'INSTANT', updatedAt: { $lt: sevenMinsAgo } },
            { type: { $exists: false }, updatedAt: { $lt: sevenMinsAgo } },
            { type: 'SCHEDULED', scheduledAt: { $lt: tenMinsAgo } },
          ],
        },
        { $set: { status: 'FAILED' } }
      )
      if (stuck.modifiedCount > 0) {
        console.log(`[CRON] Marked ${stuck.modifiedCount} stuck BROADCASTING booking(s) as FAILED`)
        // Clean up tracked timeouts for these bookings
      }

      // ===== 2. TRIGGER SCHEDULED BOOKINGS (1 hour before) =====
      const oneHourWindow = new Date(now.getTime() + 61 * 60 * 1000)
      const pastWindow = new Date(now.getTime() - 30 * 60 * 1000)
      
      // LOG TO DEBUG ALL PENDING SCHEDULED BOOKINGS
      const allPendingScheduled = await Booking.find({ type: 'SCHEDULED', status: 'CREATED' })
      if (allPendingScheduled.length > 0) {
        console.log(`[CRON-DEBUG] Total pending SCHEDULED CREATED bookings: ${allPendingScheduled.length}`)
        allPendingScheduled.forEach(b => {
          console.log(`[CRON-DEBUG] Booking ${b._id} | scheduledAt: ${b.scheduledAt} | within window: ${b.scheduledAt <= oneHourWindow && b.scheduledAt >= pastWindow} | now: ${now} | oneHourWindow: ${oneHourWindow} | pastWindow: ${pastWindow}`)
        })
      }

      const bookingsToBroadcast = await Booking.find({
        type: 'SCHEDULED',
        status: 'CREATED',
        scheduledAt: {
          $lte: oneHourWindow,
          $gte: pastWindow
        }
      })

      if (bookingsToBroadcast.length > 0) {
        console.log(`[CRON] Found ${bookingsToBroadcast.length} CREATED scheduled booking(s) to broadcast within window`)
      }

      for (const booking of bookingsToBroadcast) {
        const minsUntilBooking = Math.round((new Date(booking.scheduledAt) - now) / 60000)
        console.log(`[CRON] Triggering broadcast for scheduled booking ${booking._id} (scheduledAt=${booking.scheduledAt}, in ${minsUntilBooking} min)`)
        await startBroadcastCycle(booking._id).catch(err => {
          console.error(`[CRON] Failed to broadcast booking ${booking._id}:`, err)
        })
        activeTimeouts.add(String(booking._id))
      }

      // ===== 3. RECOVER ORPHANED BROADCASTING BOOKINGS (after server restart) =====
      // After a server restart, setTimeout is lost. Re-set timeouts for BROADCASTING scheduled bookings.
      const orphanedBroadcasting = await Booking.find({
        type: 'SCHEDULED',
        status: 'BROADCASTING',
        scheduledAt: { $gte: tenMinsAgo } // not yet expired
      })

      for (const booking of orphanedBroadcasting) {
        const bookingIdStr = String(booking._id)
        if (!activeTimeouts.has(bookingIdStr)) {
          // A booking can reach BROADCASTING (eligibility already resolved) without ever
          // actually notifying anyone, e.g. a restart or transient failure mid-cycle — it then
          // sits invisible to labourers until it eventually times out. Detect that (no
          // BroadcastLog rows at all, and enough time has passed that a healthy in-flight
          // call would have finished) and retry the whole cycle instead of just re-arming
          // the expiry timer for a booking nobody was ever told about.
          const stuckLongEnough = now.getTime() - new Date(booking.updatedAt).getTime() > 25000
          const wasNotified = stuckLongEnough ? await BroadcastLog.exists({ bookingId: booking._id }) : true
          if (!wasNotified) {
            console.log(`[CRON] Booking ${booking._id} is BROADCASTING with no BroadcastLog — retrying broadcast`)
            activeTimeouts.add(bookingIdStr)
            booking.status = 'CREATED'
            await booking.save()
            await startBroadcastCycle(booking._id).catch(err => {
              console.error(`[CRON] Retry broadcast failed for booking ${booking._id}:`, err)
            })
            continue
          }

          // This booking is BROADCASTING but has no active timeout — server must have restarted
          const timeoutMs = getBroadcastTimeoutMs(booking)
          console.log(`[CRON] Re-setting timeout for orphaned BROADCASTING booking ${booking._id} (${Math.round(timeoutMs/60000)} min)`)
          activeTimeouts.add(bookingIdStr)
          
          setTimeout(async () => {
            activeTimeouts.delete(bookingIdStr)
            try {
              const currentBooking = await Booking.findById(booking._id)
              if (currentBooking && currentBooking.status === 'BROADCASTING') {
                if (currentBooking.acceptedLabourIds && currentBooking.acceptedLabourIds.length > 0) {
                  currentBooking.status = 'ACCEPTED'
                  await currentBooking.save()
                  console.log(`[CRON] Orphaned booking ${booking._id} EXPIRED with partial acceptance`)
                  emitToUser(currentBooking.userId, 'BOOKING_ACCEPTED', { bookingId: currentBooking._id, partial: true, acceptedCount: currentBooking.acceptedLabourIds.length })
                } else {
                  currentBooking.status = 'FAILED'
                  await currentBooking.save()
                  console.log(`[CRON] Orphaned booking ${booking._id} EXPIRED without acceptance`)
                  emitToUser(currentBooking.userId, 'BOOKING_FAILED', { bookingId: currentBooking._id, reason: 'Expired' })
                }
                const io = getIo()
                if (io) io.emit('BOOKING_EXPIRED', { bookingId: currentBooking._id })
              }
            } catch (err) {
              console.error(`[CRON] Error expiring orphaned booking ${booking._id}:`, err)
            }
          }, timeoutMs)
        }
      }

      // --- B2B WorkforceRequest Cron (3 hours before shift) ---
      // 3 hours from now
      const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000)
      
      // Find all approved B2B requests waiting to be broadcasted to general pool
      const b2bRequests = await WorkforceRequest.find({
        status: 'broadcasted', // Assuming admin set it to broadcasted but it hasn't actually been sent yet
        isSocketEmitted: { $ne: true }, // We need to add this flag to schema or just use it flexibly
        preferredVendorId: { $exists: false } // Only general pool
      })

      for (const req of b2bRequests) {
        if (!req.shiftStart) continue
        
        // Parse shiftStart (e.g. "09:00 AM") and combine with startDate
        const [time, modifier] = req.shiftStart.split(' ')
        let [hours, minutes] = time.split(':')
        hours = parseInt(hours, 10)
        if (hours === 12 && modifier === 'AM') hours = 0
        if (modifier === 'PM' && hours < 12) hours += 12

        const scheduledTime = new Date(req.startDate)
        scheduledTime.setHours(hours, parseInt(minutes, 10), 0, 0)

        // If scheduled time is within 3 hours from now
        if (scheduledTime <= threeHoursFromNow && scheduledTime > now) {
          console.log(`[CRON] Broadcasting B2B Request ${req._id} starting at ${scheduledTime}`)
          
          // Mark as emitted so we don't spam
          req.set('isSocketEmitted', true) // Mongoose will allow this if strict: false, or we should add to schema. Better to just update DB directly.
          await WorkforceRequest.updateOne({ _id: req._id }, { $set: { isSocketEmitted: true } })

          // Find vendors in radius
          let vendors = await User.find({
            role: 'contractor',
            isActive: true,
            'contractorProfile.verificationStatus': 'approved',
            'contractorProfile.isAcceptingRequests': { $ne: false } // Only those accepting requests
          }).lean()

          if (req.siteId) {
             // In a real scenario, we'd get site coordinates and filter by radius.
             // For now, emit to all approved vendors as fallback
          }

          vendors.forEach(vendor => {
            emitToUser(vendor._id, 'B2B_GENERAL_BROADCAST', {
              requestId: req._id,
              lines: req.lines,
              startDate: req.startDate,
              shiftStart: req.shiftStart
            })
          })
        }
      }

    } catch (err) {
      console.error('[CRON] Error running scheduled broadcast cron:', err)
    }
  })

  console.log('Scheduled Broadcast Cron initialized.')
}
