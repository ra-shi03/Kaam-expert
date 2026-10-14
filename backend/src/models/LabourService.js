import mongoose from 'mongoose'

const labourServiceSchema = new mongoose.Schema(
  {
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabourSubcategory',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // basePrice = hourlyPrice — kept in sync, used as fallback for slot price calculation
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedDurationMins: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    iconUrl: {
      type: String,
      trim: true,
    },
    hourlyPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Legacy min/max hours — still accepted from API but auto-derived from durationPricing when slots are set
    minHours: {
      type: Number,
      default: 1,
      min: 0,
    },
    maxHours: {
      type: Number,
      default: 24,
      min: 1,
    },
    discountType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE'],
      default: 'PERCENTAGE',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAllZones: {
      type: Boolean,
      default: true,
    },
    zones: [
      {
        zone: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Zone',
        },
        price: {
          type: Number,
          default: 0,
        },
        durationPricing: [
          {
            minutes:  { type: Number, required: true },
            label:    { type: String },
            tag:      { type: String, default: null },
            price:    { type: Number, min: 0, default: 0 },
            isActive: { type: Boolean, default: true },
            _id: false,
          },
        ],
      },
    ],

    /**
     * Per-service duration slot pricing.
     * Admin sets a price for each slot that this service supports.
     * Only slots with isActive=true AND price>0 appear in the booking UI for this service.
     *
     * minutes must match a value in SystemSetting.durationOptions[].minutes.
     * label + tag are denormalized from SystemSetting for display performance.
     *
     * Price resolution order in calculateBill:
     *   1. durationPricing[].price (exact minutes match, isActive=true) ← PRIMARY
     *   2. zone override: zoneHourlyRate × (minutes / 60)              ← ZONE
     *   3. basePrice × (minutes / 60)                                  ← FALLBACK
     */
    durationPricing: [
      {
        minutes:  { type: Number, required: true },
        label:    { type: String },               // denormalized from SystemSetting
        tag:      { type: String, default: null }, // 'half_day' | 'full_day' | null
        price:    { type: Number, min: 0, required: true },
        isActive: { type: Boolean, default: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
)

// Ensure service names are unique within a subcategory
labourServiceSchema.index({ subcategoryId: 1, name: 1 }, { unique: true })

export const LabourService = mongoose.model('LabourService', labourServiceSchema)
