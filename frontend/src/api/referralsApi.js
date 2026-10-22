import { apiRequest } from './http.js'

export const referralsApi = {
  /** Own code, program terms, stats and invited users */
  getMyReferrals: () => {
    return apiRequest('/referrals/me', { method: 'GET' })
  },

  /** Public — check a code before signup */
  validateCode: (code) => {
    return apiRequest(`/referrals/validate/${encodeURIComponent(code)}`, { method: 'GET', skipAuth: true })
  },
}
