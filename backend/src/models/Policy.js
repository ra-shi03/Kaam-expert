import mongoose from 'mongoose'

const policySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['privacy', 'terms', 'faqs', 'cancellation', 'refund'],
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'contractor', 'labour'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

// Ensure only one policy per type and role
policySchema.index({ type: 1, role: 1 }, { unique: true })

export default mongoose.model('Policy', policySchema)
