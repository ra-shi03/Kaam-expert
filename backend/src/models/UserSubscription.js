import mongoose from 'mongoose'

const userSubscriptionSchema = new mongoose.Schema({
  labour: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  amountPaid: { type: Number, required: true, default: 19 },
  status: { type: String, enum: ['active', 'expired', 'refunded'], default: 'active' },
  bookingsReceived: { type: Number, default: 0 },
  refundEligibility: { type: Boolean, default: false },
  refundAmount: { type: Number, default: 0 },
  refundStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'refunded', 'failed', 'manually_approved', 'manually_rejected', 'not_eligible'], 
    default: 'pending' 
  },
  refundReason: { type: String },
  transactionId: { type: String }
}, {
  timestamps: true
})

// Ensure one subscription per labour per day
userSubscriptionSchema.index({ labour: 1, date: 1 }, { unique: true })

export const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema)
