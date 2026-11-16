import { User } from '../models/User.js'
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js'

/**
 * Standard notification types (push `data.type` + inbox `type`):
 *
 *  Customer : booking_accepted, booking_failed, booking_scheduled, booking_updated, booking_update,
 *             payment_due, job_reminder, complaint_update, referral_reward
 *  Labour   : booking_received, booking_assigned, booking_update, booking_updated, job_reminder,
 *             kyc_status, wallet_recharge_required, cash_fee_deducted, withdrawal_status,
 *             bonus_credited, bonus_reversed, complaint_update, review_received, referral_reward
 *  Admin    : admin_new_complaint, admin_new_withdrawal, admin_new_kyc
 */
export const NOTIFICATION_TYPES = Object.freeze({
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_FAILED: 'booking_failed',
})

const id = (v) => String(v?._id || v || '')

/** Customer told a labourer accepted (first accept, each extra crew member, or a partial crew at expiry). */
export function notifyBookingAccepted(booking, { partial = false, acceptedCount, labourName } = {}) {
  const count = acceptedCount ?? booking.acceptedLabourIds?.length ?? 1
  const total = booking.quantity || 1
  let body
  if (total > 1 || partial) {
    body = `${count} of ${total} labourers accepted your booking${partial ? ' — the rest could not be found in time' : ''}. Tap to view.`
  } else {
    body = `${labourName ? `${labourName} accepted` : 'A labourer accepted'} your booking and is on the way. Tap to track.`
  }
  return sendNotificationToUser(booking.userId, {
    title: 'Booking accepted ✅',
    body,
    data: { type: 'booking_accepted', bookingId: id(booking._id), url: `/app/bookings` },
  })
}

/** Customer told nobody could take the booking. */
export function notifyBookingFailed(booking, reason = '') {
  const expired = /expired/i.test(reason)
  return sendNotificationToUser(booking.userId, {
    title: 'No labourer available',
    body: expired
      ? 'Nobody accepted your booking in time. Please try again in a few minutes.'
      : 'Labourers near you are not available right now. Please try again in a few minutes.',
    data: { type: 'booking_failed', bookingId: id(booking._id), url: '/app/bookings' },
  })
}

/** Labourer told the job is theirs. */
export function notifyBookingAssigned(labourId, booking, serviceName = '') {
  return sendNotificationToUser(labourId, {
    title: 'Job confirmed 🎉',
    body: `${serviceName ? `${serviceName} job` : 'Your job'} is confirmed. Tap to see the details and start.`,
    data: { type: 'booking_assigned', bookingId: id(booking._id), url: `/app/active-job/${id(booking._id)}` },
  })
}

/** Push to every admin account (for new complaints, withdrawal requests, KYC submissions). */
export async function notifyAdmins(payload) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean()
    await Promise.all(admins.map((a) => sendNotificationToUser(a._id, payload)))
  } catch (err) {
    console.warn('[NOTIFY] admin notification failed:', err.message || err)
  }
}
