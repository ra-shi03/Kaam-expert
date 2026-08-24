import { apiRequest } from './http.js'

export const adminLabourSubscriptionsApi = {
  getPlans: () => apiRequest('/admin/labour-subscriptions/plans', { method: 'GET' }),
  createPlan: (payload) => apiRequest('/admin/labour-subscriptions/plans', { method: 'POST', body: payload }),
  updatePlan: (id, payload) => apiRequest(`/admin/labour-subscriptions/plans/${id}`, { method: 'PATCH', body: payload }),
  deletePlan: (id) => apiRequest(`/admin/labour-subscriptions/plans/${id}`, { method: 'DELETE' }),

  /** List labour subscriptions with date/status/refundStatus filters */
  getSubscriptions: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.date) qs.set('date', params.date)
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    if (params.refundStatus && params.refundStatus !== 'all') qs.set('refundStatus', params.refundStatus)
    if (params.search) qs.set('search', params.search)
    if (params.page) qs.set('page', params.page)
    if (params.limit) qs.set('limit', params.limit)
    return apiRequest(`/admin/labour-subscriptions?${qs.toString()}`, { method: 'GET' })
  },

  /** Get daily stats (revenue, refunds, counts) */
  getStats: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.date) qs.set('date', params.date)
    return apiRequest(`/admin/labour-subscriptions/stats?${qs.toString()}`, { method: 'GET' })
  },

  /** Get list of subscriptions eligible for refund today */
  getRefundEligible: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.date) qs.set('date', params.date)
    return apiRequest(`/admin/labour-subscriptions/refund-eligible?${qs.toString()}`, { method: 'GET' })
  },

  /** Get refund history */
  getRefundHistory: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.date) qs.set('date', params.date)
    if (params.page) qs.set('page', params.page)
    return apiRequest(`/admin/labour-subscriptions/history?${qs.toString()}`, { method: 'GET' })
  },

  /** Get a single subscription detail */
  getById: (id) => apiRequest(`/admin/labour-subscriptions/${id}`, { method: 'GET' }),

  /** Process admin refund — action: 'approve' | 'reject' | 'process' */
  processRefund: (id, action, note = '') =>
    apiRequest(`/admin/labour-subscriptions/${id}/refund`, {
      method: 'PATCH',
      body: { action, note },
    }),
}
