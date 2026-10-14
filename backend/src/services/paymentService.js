import Razorpay from 'razorpay'
import crypto from 'crypto'

let razorpayInstance = null

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('Razorpay keys not found in environment. Using mock mode.')
      return null
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

export const createOrder = async (amount, currency = 'INR', receipt = 'receipt#1') => {
  const instance = getRazorpayInstance()
  const roundedAmountInPaise = Math.max(100, Math.round(Number(amount) * 100))
  const cleanReceipt = String(receipt).slice(0, 40)
  
  if (!instance) {
    // Mock successful order creation for MVP if keys are missing
    return {
      id: `order_mock_${Date.now()}`,
      amount: roundedAmountInPaise,
      currency,
      receipt: cleanReceipt,
      status: 'created',
      mock: true
    }
  }

  const options = {
    amount: roundedAmountInPaise, // amount in the smallest currency unit (must be an integer)
    currency,
    receipt: cleanReceipt,
  }

  try {
    return await instance.orders.create(options)
  } catch (err) {
    console.error('Razorpay order creation failed:', err)
    const description = err.error?.description || err.message || 'Payment provider error'
    const error = new Error(description)
    error.statusCode = err.statusCode || 400
    error.code = err.error?.code || 'GATEWAY_ERROR'
    throw error
  }
}

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return true // Mock mode

  const shasum = crypto.createHmac('sha256', secret)
  shasum.update(`${orderId}|${paymentId}`)
  const digest = shasum.digest('hex')

  return digest === signature
}
