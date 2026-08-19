import cron from 'node-cron'
import { UserSubscription } from '../models/UserSubscription.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'

/**
 * Run every hour at minute 5 to check if the operational window has ended dynamically.
 * At end of window:
 *   - Subscriptions with 0 bookings → mark refundEligibility = true, refundStatus = 'pending'
 *   - Subscriptions with bookings    → mark not_eligible + expire
 */
export function initSubscriptionRefundCron() {
  cron.schedule('5 * * * *', async () => {
    try {
      const settings = await SystemSetting.findOne({ configKey: 'master_config' })
      const endHour = settings?.subscriptionEndHour ?? 20

      // Get current IST hour
      const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const currentHour = nowIST.getHours()

      // Only process refunds if the current hour matches the configured end hour
      if (currentHour !== endHour) {
        return
      }

      console.log(`[CRON] Operational window ended (${endHour}:00 IST). Running daily subscription settlement...`)
      const today = nowIST.toISOString().split('T')[0]

      // Find all active subscriptions for today that haven't been settled yet
      const subscriptions = await UserSubscription.find({
        date: today,
        status: 'active',
        refundStatus: 'pending',
      }).populate('labour')

      let zeroBookingCount = 0
      let withBookingCount = 0

      for (const sub of subscriptions) {
        if (!sub.labour) {
          console.warn(`[CRON] Labour not found for subscription ${sub._id}`)
          continue
        }

        // Check bookings offered — use either bookingsReceived or bookingOpportunitiesOffered
        const hasBookingActivity = (sub.bookingsReceived > 0) || (sub.bookingOpportunitiesOffered > 0)

        if (!hasBookingActivity) {
          // ---- REFUND ELIGIBLE ----
          sub.refundEligibility = true
          sub.refundAmount = sub.amountPaid
          sub.refundStatus = 'pending'   // Admin sees this in their panel
          sub.refundReason = 'Zero bookings received during operational window'
          // Don't auto-expire yet — let admin process or auto-process below

          // Auto-process refund to wallet (configurable — right now we auto-process)
          try {
            let wallet = await Wallet.findOne({ user: sub.labour._id })
            if (!wallet) {
              wallet = await Wallet.create({ user: sub.labour._id, balance: 0 })
            }

            wallet.balance = (wallet.balance || 0) + sub.amountPaid
            await wallet.save()

            await WalletTransaction.create({
              wallet: wallet._id,
              type: 'credit',
              amount: sub.amountPaid,
              description: `Auto-refund for daily subscription (${today}) — 0 bookings received`,
              referenceModel: 'UserSubscription',
              referenceId: sub._id,
              status: 'completed',
            })

            sub.status = 'refunded'
            sub.refundStatus = 'refunded'
            sub.refundTimestamp = new Date()
            sub.refundProcessedAt = new Date()
            sub.refundTransactionId = `AUTO-${Date.now()}-${sub._id}`
            zeroBookingCount++
          } catch (walletErr) {
            console.error(`[CRON] Failed to process refund for sub ${sub._id}:`, walletErr)
            sub.refundStatus = 'failed'
            sub.refundReason = `Auto-refund failed: ${walletErr.message}`
          }
        } else {
          // ---- NOT ELIGIBLE ----
          sub.refundEligibility = false
          sub.refundStatus = 'not_eligible'
          sub.refundReason = `Received ${sub.bookingsReceived} booking(s) / ${sub.bookingOpportunitiesOffered} offer(s)`
          sub.status = 'expired'
          withBookingCount++
        }

        await sub.save()
      }

      console.log(
        `[CRON] Settlement complete. ` +
        `Refunded: ${zeroBookingCount}, No-refund: ${withBookingCount}, Total processed: ${subscriptions.length}`
      )
    } catch (error) {
      console.error('[CRON] Error during subscription refund evaluation:', error)
    }
  })
}
