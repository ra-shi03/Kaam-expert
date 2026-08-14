import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    targetUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    panel: {
      type: String,
      enum: ['APP', 'CONTRACTOR', 'VENDOR', 'EXPLORE'],
      default: 'APP',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    targetAudience: [
      {
        type: String,
        enum: ['ALL', 'LABOUR', 'VENDOR', 'CONTRACTOR'],
        default: 'ALL',
      }
    ],
  },
  { timestamps: true }
)

export const Banner = mongoose.model('Banner', bannerSchema)
