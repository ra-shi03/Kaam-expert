import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  durationDays: { type: Number, required: true },
  price: { type: Number, required: true },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
})

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema)
