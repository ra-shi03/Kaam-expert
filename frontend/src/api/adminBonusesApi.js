import { apiRequest } from './http.js'

export const adminBonusesApi = {
  /**
   * @param {{ status?: string, bonusType?: string, search?: string, from?: string, to?: string, page?: number, limit?: number }} params
   */
  list: (params = {}) => {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') sp.set(k, String(v))
    })
    return apiRequest(`/admin/bonuses?${sp.toString()}`, { method: 'GET' })
  },

  getById: (id) => {
    return apiRequest(`/admin/bonuses/${encodeURIComponent(id)}`, { method: 'GET' })
  },

  /**
   * Credits the labour wallet. `idempotencyKey` must be unique per award and reused when retrying it,
   * so a timeout + retry can never pay the bonus twice.
   */
  create: (payload, idempotencyKey) => {
    return apiRequest('/admin/bonuses', {
      method: 'POST',
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey },
    })
  },

  reverse: (id, reason) => {
    return apiRequest(`/admin/bonuses/${encodeURIComponent(id)}/reverse`, {
      method: 'PATCH',
      body: { reason },
    })
  },
}
