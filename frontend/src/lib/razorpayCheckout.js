import { paymentsApi } from '../api/paymentsApi.js'

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Creates an order, opens Razorpay checkout and verifies the payment on the backend.
 * Without Razorpay keys the backend returns a mock order, which is verified directly (dev/demo).
 * Resolves with the verify response, or `null` if the user closed the checkout.
 */
export async function payWithRazorpay({ amount, purpose, description, prefill, extra = {} }) {
  const initRes = await paymentsApi.initPayment({ amount, purpose, ...extra })
  const order = initRes.data?.order
  if (!order) throw new Error('Payment initialization failed')

  if (order.mock || order.id?.startsWith('order_mock_')) {
    return paymentsApi.verifyPayment({
      razorpayOrderId: order.id,
      razorpayPaymentId: `pay_mock_${Date.now()}`,
      razorpaySignature: 'mock_signature',
    })
  }

  if (!(await loadRazorpay())) throw new Error('Payment gateway failed to load')

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.id,
      name: 'KaamExpert',
      description,
      prefill,
      handler: (response) => {
        paymentsApi
          .verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          .then(resolve, reject)
      },
      modal: { ondismiss: () => resolve(null) },
      theme: { color: '#002b5c' },
    })
    rzp.open()
  })
}
