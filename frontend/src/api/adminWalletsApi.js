import { apiRequest } from './http.js'

export const adminWalletsApi = {
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
  }
}
