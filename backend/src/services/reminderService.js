import { Booking } from '../models/Booking.js'
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js'

const MIN = 60 * 1000

function labourIdsOf(booking) {
  const ids = (booking.assignments || []).map((a) => a.labourId).filter(Boolean)
  if (ids.length === 0 && booking.laborId) ids.push(booking.laborId)
  return [...new Set(ids.map(String))]
}

/**
 * Sends "your scheduled job starts soon" reminders to the customer and the accepted labourers.
 *   - first reminder when <= 60 min remain, second when <= 15 min remain
 * Each reminder is claimed atomically (reminderXXSentAt) so repeated cron ticks, or two server
 * instances, never send it twice. Returns how many bookings were reminded.
 */
export async function runJobReminders(now = new Date()) {
  let reminded = 0
  const steps = [
    { field: 'reminder15SentAt', withinMin: 15 },
    { field: 'reminder60SentAt', withinMin: 60 },
  ]

  for (const { field, withinMin } of steps) {
    const due = await Booking.find({
      type: 'SCHEDULED',
      status: { $in: ['ACCEPTED', 'ASSIGNED'] },
      scheduledAt: { $gt: now, $lte: new Date(now.getTime() + withinMin * MIN) },
      [field]: { $exists: false },
    }).select('_id').lean()

    for (const { _id } of due) {
      // Claim it: only the caller that flips the flag sends the reminder
      const claimed = await Booking.findOneAndUpdate(
        { _id, [field]: { $exists: false }, status: { $in: ['ACCEPTED', 'ASSIGNED'] } },
        { $set: { [field]: now } },
        { new: true },
      )
      if (!claimed) continue

      const minsLeft = Math.max(1, Math.round((new Date(claimed.scheduledAt).getTime() - now.getTime()) / MIN))
      const when = minsLeft >= 60 ? 'about an hour' : `${minsLeft} min`
      const bookingId = String(claimed._id)

      sendNotificationToUser(claimed.userId, {
        title: 'Your booking starts soon ⏰',
        body: `Your scheduled booking starts in ${when}. Your labourer is on the way to being ready.`,
        data: { type: 'job_reminder', bookingId, url: '/app/bookings' },
      })
      for (const lid of labourIdsOf(claimed)) {
        sendNotificationToUser(lid, {
          title: 'Job starts soon ⏰',
          body: `Your scheduled job starts in ${when}. Please get ready and head to the location.`,
          data: { type: 'job_reminder', bookingId, url: `/app/active-job/${bookingId}` },
        })
      }
      reminded++
    }
  }
  return reminded
}
