import Razorpay from 'razorpay'
import crypto from 'crypto'
import { UserSubscription } from '../models/UserSubscription.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured in environment')
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export const getMySubscription = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const subscription = await UserSubscription.findOne({ labour: req.user.id, date: today })
  
  return sendSuccess(res, { data: { subscription } })
})

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const price = settings?.dailySubscriptionPrice || 19

  const amountInPaise = price * 100

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_sub_${Date.now()}`,
    notes: {
      userId: req.user.id.toString(),
      type: 'daily_subscription'
    }
  }

  const razorpay = getRazorpayInstance()
  const order = await razorpay.orders.create(options)
  return sendSuccess(res, { data: { order, keyId: process.env.RAZORPAY_KEY_ID, price } })
})

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
  const today = new Date().toISOString().split('T')[0]

  let subscription = await UserSubscription.findOne({ labour: req.user.id, date: today })
  if (subscription) {
    subscription.status = 'active'
    subscription.transactionId = razorpay_payment_id
    subscription.amountPaid = price
    await subscription.save()
  } else {
    subscription = await UserSubscription.create({
      labour: req.user.id,
      date: today,
      amountPaid: price,
      status: 'active',
      transactionId: razorpay_payment_id,
      bookingsReceived: 0,
    })
  }

  return sendSuccess(res, { message: 'Subscription purchased successfully', data: { subscription } })
})
