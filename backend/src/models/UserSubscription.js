import mongoose from 'mongoose'

const userSubscriptionSchema = new mongoose.Schema({
  labour: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD (Start Date)
  endDate: { type: String, required: true }, // Format: YYYY-MM-DD
  durationDays: { type: Number, required: true, default: 1 },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
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
  transactionId: { type: String },
  // Enhanced refund tracking fields
  refundTransactionId: { type: String },
  refundTimestamp: { type: Date },
  refundProcessedAt: { type: Date },
  adminActionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminActionNote: { type: String },
  refundAttemptCount: { type: Number, default: 0 },
  // Track booking details for audit
  bookingOpportunitiesOffered: { type: Number, default: 0 }, // bookings offered (even rejected ones)
  bookingOpportunitiesAccepted: { type: Number, default: 0 },
  subscriptionStartHour: { type: Number }, // snapshot of window at time of purchase
  subscriptionEndHour: { type: Number },   // snapshot of window at time of purchase
}, {
  timestamps: true
})

// Removed the unique index on { labour: 1, date: 1 } to allow application-level overlap checking
userSubscriptionSchema.index({ labour: 1, date: 1 })
userSubscriptionSchema.index({ date: 1, endDate: 1, status: 1 })
userSubscriptionSchema.index({ date: 1, refundEligibility: 1 })

export const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema)
