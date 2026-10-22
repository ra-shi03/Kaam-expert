import mongoose from 'mongoose'

export const BONUS_TYPES = ['performance', 'incentive', 'festival', 'compensation', 'other']

export const BONUS_STATUS = {
  CREDITED: 'CREDITED',
  REVERSED: 'REVERSED',
}

/**
 * One admin-awarded bonus to a labourer. The wallet credit and its ledger entry are written
 * in the same transaction as this record, so the three can never drift apart.
 * Amounts are whole rupees — the same unit the Wallet uses.
 */
const bonusSchema = new mongoose.Schema(
  {
    bonusCode: { type: String, required: true, unique: true, immutable: true },
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isSafeInteger, message: 'Bonus amount must be whole rupees' },
    },
    bonusType: { type: String, enum: BONUS_TYPES, required: true },
    /** Shown to the labourer */
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    /** Admin-only — never returned by labour-facing endpoints */
    internalNote: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: Object.values(BONUS_STATUS),
      default: BONUS_STATUS.CREDITED,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction', required: true },
    /** Client-generated key per award operation — a retried request returns the original bonus */
    idempotencyKey: { type: String, required: true },

    reversedAt: Date,
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reversalReason: { type: String, trim: true, maxlength: 500 },
    reversalTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
  },
  { timestamps: true },
)

bonusSchema.index({ createdBy: 1, idempotencyKey: 1 }, { unique: true })
bonusSchema.index({ createdAt: -1 })
bonusSchema.index({ labourId: 1, createdAt: -1 })

export const Bonus = mongoose.model('Bonus', bonusSchema)
