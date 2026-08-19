import Razorpay from 'razorpay'
import crypto from 'crypto'
import { UserSubscription } from '../models/UserSubscription.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import { KYC_STATUS } from '../constants/roles.js'

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured in environment')
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

/** Helper — get today string in IST */
function getTodayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** Helper — get current IST hour */
function getCurrentISTHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }))
}

/**
 * GET /user-subscriptions/my-subscription
 * Returns today's subscription + settings info for the labour
 */
export const getMySubscription = asyncHandler(async (req, res) => {
  const today = getTodayIST()
  const subscription = await UserSubscription.findOne({ labour: req.user.id, date: today })

  // Also return system settings for the labour to display window info
  const settings = await SystemSetting.findOne({ configKey: 'master_config' })

  return sendSuccess(res, {
    data: {
      subscription,
      settings: {
        dailySubscriptionPrice: settings?.dailySubscriptionPrice || 19,
        subscriptionStartHour: settings?.subscriptionStartHour ?? 8,
        subscriptionEndHour: settings?.subscriptionEndHour ?? 20,
        isUserSubscriptionEnabled: settings?.isUserSubscriptionEnabled ?? true,
        freeTrialDays: settings?.freeTrialDays ?? 3,
      },
    },
  })
})

/**
 * POST /user-subscriptions/order
 * Create Razorpay order for daily subscription
 */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const labour = req.user
  const today = getTodayIST()

  // Validate KYC is approved
  if (labour.labourProfile?.kycStatus !== KYC_STATUS.VERIFIED) {
    return sendError(res, {
      message: 'KYC must be approved before purchasing subscription',
      statusCode: HTTP_STATUS.FORBIDDEN,
    })
  }

  // Check if already subscribed today
  const existing = await UserSubscription.findOne({ labour: labour.id, date: today })
  if (existing && existing.status === 'active') {
    return sendError(res, {
      message: 'You already have an active subscription for today',
      statusCode: HTTP_STATUS.CONFLICT,
    })
  }

  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const price = settings?.dailySubscriptionPrice || 19
  const startHour = settings?.subscriptionStartHour ?? 8
  const endHour = settings?.subscriptionEndHour ?? 20
  const currentHour = getCurrentISTHour()

  // Validate subscription window
  if (currentHour < startHour) {
    return sendError(res, {
      message: `Subscription can only be purchased from ${startHour}:00 AM onwards`,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    })
  }
  if (currentHour >= endHour) {
    return sendError(res, {
      message: `Subscription window has closed for today. It was valid until ${endHour}:00 PM`,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    })
  }

  const amountInPaise = price * 100

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_sub_${Date.now()}`,
    notes: {
      userId: labour.id.toString(),
      type: 'daily_subscription',
      date: today,
    },
  }

  const razorpay = getRazorpayInstance()
  const order = await razorpay.orders.create(options)
  return sendSuccess(res, {
    data: {
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      price,
      startHour,
      endHour,
      date: today,
    },
  })
})

/**
 * POST /user-subscriptions/verify
 * Verify Razorpay payment and activate subscription
 */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (generatedSignature !== razorpay_signature) {
    return sendError(res, { message: 'Payment verification failed', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const price = settings?.dailySubscriptionPrice || 19
  const startHour = settings?.subscriptionStartHour ?? 8
  const endHour = settings?.subscriptionEndHour ?? 20
  const today = getTodayIST()

  let subscription = await UserSubscription.findOne({ labour: req.user.id, date: today })
  if (subscription) {
    subscription.status = 'active'
    subscription.transactionId = razorpay_payment_id
    subscription.amountPaid = price
    subscription.subscriptionStartHour = startHour
    subscription.subscriptionEndHour = endHour
    await subscription.save()
  } else {
    subscription = await UserSubscription.create({
      labour: req.user.id,
      date: today,
      amountPaid: price,
      status: 'active',
      transactionId: razorpay_payment_id,
      bookingsReceived: 0,
      subscriptionStartHour: startHour,
      subscriptionEndHour: endHour,
    })
  }

  return sendSuccess(res, { message: 'Subscription purchased successfully', data: { subscription } })
})

/**
 * GET /user-subscriptions/check-access
 * Check if the current labour can access the marketplace
 * Used by frontend to gate dashboard access
 */
export const checkLabourAccess = asyncHandler(async (req, res) => {
  const labour = req.user
  const settings = await SystemSetting.findOne({ configKey: 'master_config' })

  const isSubscriptionEnabled = settings?.isUserSubscriptionEnabled ?? true
  const startHour = settings?.subscriptionStartHour ?? 8
  const endHour = settings?.subscriptionEndHour ?? 20
  const currentHour = getCurrentISTHour()

  // 1. Check KYC
  if (labour.labourProfile?.kycStatus !== KYC_STATUS.VERIFIED) {
    return sendSuccess(res, {
      data: {
        hasAccess: false,
        reason: 'kyc_pending',
        message: 'KYC approval required',
      },
    })
  }

  // 2. Check free trial
  const trialEndsAt = labour.labourProfile?.trialEndsAt
  const now = new Date()
  if (trialEndsAt && new Date(trialEndsAt) > now) {
    return sendSuccess(res, {
      data: {
        hasAccess: true,
        reason: 'free_trial',
        message: 'Free trial active',
        trialEndsAt,
        daysRemaining: Math.ceil((new Date(trialEndsAt) - now) / (1000 * 60 * 60 * 24)),
      },
    })
  }

  // 3. If subscription is disabled globally, allow access
  if (!isSubscriptionEnabled) {
    return sendSuccess(res, {
      data: {
        hasAccess: true,
        reason: 'subscription_disabled',
        message: 'Subscription feature is not active',
      },
    })
  }

  // 4. Check today's subscription
  const today = getTodayIST()
  const subscription = await UserSubscription.findOne({ labour: labour.id, date: today })

  if (subscription && subscription.status === 'active') {
    const withinWindow = currentHour >= startHour && currentHour < endHour
    return sendSuccess(res, {
      data: {
        hasAccess: true,
        reason: 'subscription_active',
        message: withinWindow ? 'Subscription active and within window' : 'Subscription active but outside window',
        withinWindow,
        subscription,
        startHour,
        endHour,
      },
    })
  }

  // 5. No access — trial ended, no subscription
  return sendSuccess(res, {
    data: {
      hasAccess: false,
      reason: 'subscription_required',
      message: 'Daily subscription required',
      startHour,
      endHour,
      price: settings?.dailySubscriptionPrice || 19,
      canPurchaseNow: currentHour >= startHour && currentHour < endHour,
    },
  })
})
