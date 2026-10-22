import { apiRequest } from './http.js'

export const walletsApi = {
  getMyWallet: () => {
    return apiRequest('/wallets/me', { method: 'GET' })
  },

  getEarningsSummary: () => {
    return apiRequest('/wallets/earnings-summary', { method: 'GET' })
  },

  /** Wallet statement (recharges, cash-job fees, payouts, bonuses, …), newest first */
  getTransactions: ({ page = 1, limit = 20 } = {}) => {
    return apiRequest(`/wallets/transactions?page=${page}&limit=${limit}`, { method: 'GET' })
  },

  getMyBonuses: () => {
    return apiRequest('/wallets/bonuses', { method: 'GET' })
  },
}
