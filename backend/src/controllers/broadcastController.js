import { Booking } from '../models/Booking.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import { KYC_STATUS } from '../constants/roles.js'

/**
 * Validate that labour can receive/accept bookings.
 * Chain: KYC approved → trial OR subscription active → within hours → available
 */
async function validateLabourBookingAccess(labour) {
  const { SystemSetting } = await import('../models/SystemSetting.js')
  const { UserSubscription } = await import('../models/UserSubscription.js')

  // 1. KYC check
  if (labour.labourProfile?.kycStatus !== KYC_STATUS.VERIFIED) {
    return { allowed: false, code: 'KYC_NOT_APPROVED', message: 'KYC not approved. Cannot receive bookings.' }
  }

  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const isSubEnabled = settings?.isUserSubscriptionEnabled ?? true
  const startHour = settings?.subscriptionStartHour ?? 8
  const endHour = settings?.subscriptionEndHour ?? 20

  // 2. Check free trial
  const trialEndsAt = labour.labourProfile?.trialEndsAt
  const now = new Date()
  const inTrial = trialEndsAt && new Date(trialEndsAt) > now

  // 3. If subscription feature is disabled — skip subscription check
  if (!isSubEnabled || inTrial) {
    return { allowed: true }
  }

  // 4. Check today's subscription
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const subscription = await UserSubscription.findOne({ labour: labour._id, date: todayIST })

  if (!subscription || subscription.status !== 'active') {
    return {
      allowed: false,
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'Daily subscription required to receive bookings.',
    }
  }

  // 5. Check operating window
  const currentHour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })
  )
  if (currentHour < startHour || currentHour >= endHour) {
    return {
      allowed: false,
      code: 'OUTSIDE_OPERATING_HOURS',
      message: `Bookings are only available between ${startHour}:00 and ${endHour}:00.`,
    }
  }

  return { allowed: true, subscription }
}

export const acceptBroadcast = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const labour = req.user

  // Subscription validation chain
  const accessCheck = await validateLabourBookingAccess(labour)
  if (!accessCheck.allowed) {
    return sendError(res, {
      message: accessCheck.message,
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: accessCheck.code,
    })
  }

  // Cash Limit check
  const { Wallet } = await import('../models/Wallet.js')
  const { SystemSetting } = await import('../models/SystemSetting.js')

  const wallet = await Wallet.findOne({ userId: labour._id })
  if (wallet && wallet.adminBalance > 0) {
    const settings = await SystemSetting.findOne({ configKey: 'master_config' })
    if (settings && wallet.adminBalance >= (settings.labourCashLimit ?? 500)) {
      return sendError(res, {
        message: `Cannot accept new bookings. You owe the admin ₹${wallet.adminBalance}. Please clear your dues first.`,
        statusCode: HTTP_STATUS.FORBIDDEN,
      })
    }
  }

  // Atomic FCFS Update
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'BROADCASTING' },
    {
      $set: {
        status: 'ACCEPTED',
        acceptedLabourId: labour._id,
        laborId: labour._id,
      },
    },
    { new: true }
  )

  if (!booking) {
    const currentBooking = await Booking.findById(bookingId)
    if (!currentBooking) {
      return sendError(res, { message: 'Booking not found', statusCode: HTTP_STATUS.NOT_FOUND })
    }
    if (currentBooking.status === 'ACCEPTED') {
      return sendError(res, { message: 'Booking was already accepted by another labourer', statusCode: HTTP_STATUS.CONFLICT })
    }
    if (currentBooking.status === 'CANCELLED') {
      return sendError(res, { message: 'Booking was cancelled by the customer', statusCode: HTTP_STATUS.BAD_REQUEST })
    }
    return sendError(res, {
      message: `Cannot accept booking. Current status is ${currentBooking.status}`,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    })
  }

  // Increment subscription bookingsAccepted count
  if (accessCheck.subscription) {
    const { UserSubscription } = await import('../models/UserSubscription.js')
    await UserSubscription.findByIdAndUpdate(accessCheck.subscription._id, {
      $inc: { bookingsReceived: 1, bookingOpportunitiesAccepted: 1 },
    })
  }

  // Increment lifetime broadcasts accepted
  const { User } = await import('../models/User.js')
  await User.findByIdAndUpdate(labour._id, {
    $inc: { 'labourProfile.lifetimeBroadcastsAccepted': 1 }
  })

  // Notify customer
  import('../socket.js')
    .then(({ emitToUser, getSocketServer }) => {
      emitToUser(booking.userId, 'BOOKING_ACCEPTED', { bookingId: booking._id, laborId: labour._id })
      const io = getSocketServer()
      if (io) {
        io.emit('BOOKING_EXPIRED', { bookingId: booking._id, winnerId: labour._id })
      }
    })
    .catch((err) => console.error('Failed to notify sockets:', err))

  return sendSuccess(res, { message: 'Booking accepted successfully', data: { booking } })
})

export const rejectBroadcast = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const labour = req.user

  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'BROADCASTING' },
    { $addToSet: { rejectedBy: labour._id } },
    { new: true }
  )

  if (!booking) {
    return sendSuccess(res, { message: 'Booking already handled or no longer broadcasting' })
  }

  // Track booking opportunities offered to this labour (even if rejected)
  // Per spec: a booking offered but rejected still counts as an opportunity
  try {
    const { SystemSetting } = await import('../models/SystemSetting.js')
    const { UserSubscription } = await import('../models/UserSubscription.js')
    const settings = await SystemSetting.findOne({ configKey: 'master_config' })
    const isSubEnabled = settings?.isUserSubscriptionEnabled ?? true

    if (isSubEnabled) {
      const trialEndsAt = labour.labourProfile?.trialEndsAt
      const inTrial = trialEndsAt && new Date(trialEndsAt) > new Date()
      if (!inTrial) {
        const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        await UserSubscription.findOneAndUpdate(
          { labour: labour._id, date: todayIST, status: 'active' },
          { $inc: { bookingOpportunitiesOffered: 1 } }
        )
      }
    }
  } catch (e) {
    console.error('[broadcastController] Failed to track booking opportunity:', e)
  }

  // If everyone eligible has rejected it, fail it
  if (booking.rejectedBy.length >= (booking.eligibleLabourCount || 0)) {
    booking.status = 'FAILED'
    await booking.save()

    import('../socket.js')
      .then(({ emitToUser, getSocketServer }) => {
        emitToUser(booking.userId, 'BOOKING_FAILED', {
          bookingId: booking._id,
          reason: 'All available labourers declined',
        })
        const io = getSocketServer()
        if (io) {
          io.emit('BOOKING_EXPIRED', { bookingId: booking._id })
        }
      })
      .catch((err) => console.error('Failed to notify sockets on reject:', err))
  }

  return sendSuccess(res, { message: 'Booking rejected successfully' })
})
