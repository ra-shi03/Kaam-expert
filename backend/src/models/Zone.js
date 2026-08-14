import mongoose from 'mongoose'

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    pincodes: [{
      type: String,
      trim: true
    }],
    // GeoJSON Polygon for the zone boundaries
    polygon: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of arrays of numbers [lng, lat]
        required: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
)

zoneSchema.index({ polygon: '2dsphere' })

export const Zone = mongoose.model('Zone', zoneSchema)
