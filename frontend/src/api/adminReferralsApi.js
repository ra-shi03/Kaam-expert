import { apiRequest } from './http.js'

export const adminReferralsApi = {
  list: ({ status = 'all', search = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ status, page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    return apiRequest(`/admin/referrals?${params.toString()}`, { method: 'GET' })
  },

  approve: (id) => {
    return apiRequest(`/admin/referrals/${id}/approve`, { method: 'PATCH' })
  },

  reject: (id, reason) => {
    return apiRequest(`/admin/referrals/${id}/reject`, {
      method: 'PATCH',
      body: { reason },
    })
  },
}
