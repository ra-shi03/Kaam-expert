import { apiRequest } from './http.js'

export const walletsApi = {
  getMyWallet: () => {
    return apiRequest('/wallets/me', { method: 'GET' })
  },

  clearAdminDues: (payload) => {
    return apiRequest('/wallets/clear', {
      method: 'POST',
      body: payload,
    })
  },

  getEarningsSummary: () => {
    return apiRequest('/wallets/earnings-summary', { method: 'GET' })
  },
}
