import { apiRequest } from './http.js'

export const adminWalletsApi = {
  /**
   * Labour wallets with balance / recharge / dues
   * @param {{ search?: string, filter?: 'all' | 'dues' | 'low' | 'recharged', page?: number, limit?: number }} params
   */
  getLabourWallets: ({ search = '', filter = 'all', page = 1, limit = 15 } = {}) => {
    const params = new URLSearchParams({ filter, page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    return apiRequest(`/admin/wallets/labours?${params.toString()}`, { method: 'GET' })
  },

  getLabourWalletTransactions: (userId, { page = 1, limit = 20 } = {}) => {
    return apiRequest(`/admin/wallets/labours/${userId}/transactions?page=${page}&limit=${limit}`, { method: 'GET' })
  },

  /**
   * Get all withdrawal requests for admin
   */
  getAllWithdrawals: () => {
    return apiRequest('/admin/wallets/withdrawals', { method: 'GET' })
  },

  getVendorWithdrawals: () => {
    return apiRequest('/admin/wallets/vendor-withdrawals', { method: 'GET' })
  },

  getVendorWalletStats: () => {
    return apiRequest('/admin/wallets/vendor-stats', { method: 'GET' })
  },

  /**
   * Update withdrawal status (e.g. APPROVED or REJECTED)
   * @param {string} id - Withdrawal Request ID
   * @param {string} status - New status
   */
  updateWithdrawalStatus: (id, status, adminRemarks = '') => {
    return apiRequest(`/admin/wallets/withdrawals/${id}`, {
      method: 'PATCH',
      body: { status, adminRemarks },
    })
  },

  /**
   * Delete a withdrawal request
   */
  deleteWithdrawalRequest: (id) => {
    return apiRequest(`/admin/wallets/withdrawals/${id}`, { method: 'DELETE' })
  }
}
