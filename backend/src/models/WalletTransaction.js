import mongoose from 'mongoose'

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    targetWallet: {
      type: String,
      enum: ['SELF', 'ADMIN', 'BANK'],
      required: true,
    },
    context: {
      type: String,
      enum: ['BOOKING', 'CLEARANCE', 'INCENTIVE', 'PENALTY', 'PAYOUT', 'MANUAL', 'WITHDRAWAL', 'REFUND', 'REFERRAL', 'RECHARGE', 'CASH_COMMISSION', 'BONUS', 'BONUS_REVERSAL'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    /** Net wallet balance (earnings + recharge − dues) right after this entry — lets the app show a statement */
    balanceAfter: {
      type: Number,
    },
  },
  { timestamps: true }
)

walletTransactionSchema.index({ walletId: 1, createdAt: -1 })

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema)
