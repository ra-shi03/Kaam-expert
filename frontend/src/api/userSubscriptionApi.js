import { apiRequest } from './http'

export const userSubscriptionApi = {
  getPlans: () => apiRequest('/user-subscriptions/plans'),

  /** Check if labour has access to the marketplace (trial/subscription gate) */
  checkAccess: () => apiRequest('/user-subscriptions/check-access'),

  /** Get today's subscription + system settings */
  getMySubscription: () => apiRequest('/user-subscriptions/my-subscription'),

  /** Create a Razorpay order for daily or package subscription */
  createOrder: (data = {}) => apiRequest('/user-subscriptions/order', {
    method: 'POST',
    body: data,
  }),

  /** Verify Razorpay payment and activate subscription */
  verifyPayment: (data) => apiRequest('/user-subscriptions/verify', {
    method: 'POST',
    body: data,
  }),
}
