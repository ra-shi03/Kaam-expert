import mongoose from 'mongoose'

export const REFERRAL_STATUS = {
  PENDING: 'PENDING',
  REWARDED: 'REWARDED',
  REJECTED: 'REJECTED',
}

/**
 * One row per referred signup. Created when a new user registers with someone's code;
 * moves to REWARDED once the qualifying action happens (or an admin approves it).
 */
const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refereeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    referrerRole: { type: String, trim: true },
    refereeRole: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(REFERRAL_STATUS),
      default: REFERRAL_STATUS.PENDING,
      index: true,
    },
    /** Amounts (INR) actually credited — snapshotted at reward time */
    referrerReward: { type: Number, default: 0, min: 0 },
    refereeReward: { type: Number, default: 0, min: 0 },
    rewardedAt: Date,
    rejectedReason: { type: String, trim: true, maxlength: 300 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export const Referral = mongoose.model('Referral', referralSchema)
