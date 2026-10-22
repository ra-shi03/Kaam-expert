/** Keep keys in sync with backend `models/Bonus.js` BONUS_TYPES */
export const BONUS_TYPE_LABELS = {
  performance: 'Performance bonus',
  incentive: 'Incentive bonus',
  festival: 'Festival / special bonus',
  compensation: 'Compensation / goodwill',
  other: 'Other',
}

/** Human labels for wallet ledger contexts (backend `models/WalletTransaction.js`) */
export const WALLET_CONTEXT_LABELS = {
  RECHARGE: 'Wallet recharge',
  CASH_COMMISSION: 'Cash job platform fee',
  PAYOUT: 'Online job earning',
  BONUS: 'Bonus',
  BONUS_REVERSAL: 'Bonus reversed',
  REFERRAL: 'Referral reward',
  REFUND: 'Refund',
  WITHDRAWAL: 'Withdrawal to bank',
  CLEARANCE: 'Dues cleared',
  BOOKING: 'Cash job dues',
  INCENTIVE: 'Incentive',
  PENALTY: 'Penalty',
  MANUAL: 'Adjustment',
}

/** ₹ amount in rupees; negatives render as -₹X */
export function formatRupees(amount) {
  const n = Number(amount) || 0
  const abs = Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
  return n < 0 ? `-₹${abs}` : `₹${abs}`
}
