import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    laborId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabourSubcategory',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabourService',
      required: true,
    },
    type: {
      type: String,
      enum: ['INSTANT', 'SCHEDULED'],
      required: true,
    },
    scheduledAt: {
      type: Date,
    },
    timeSlot: {
      type: String,
    },
    endTime: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    // durationKind: broad category used for display/filtering
    // Auto-assigned from slot tag when booking is created with durationMinutes
    durationKind: {
      type: String,
      enum: ['few_hours', 'half_day', 'full_day', 'multi_day'],
      default: 'few_hours',
    },
    // hours: kept for backward compatibility (= durationMinutes / 60)
    hours: {
      type: Number,
      default: 1,
      min: 0,
    },
    // durationMinutes: exact booked duration in minutes (new primary field)
    durationMinutes: {
      type: Number,
      min: 1,
      default: 60,
    },
    // selectedSlotLabel: human-readable label for display across all screens
    // e.g. "30 Minutes", "1 Hr 15 Min", "Half Day (6 hrs)"
    selectedSlotLabel: {
      type: String,
      default: '',
    },
    // slotPriceSnapshot: the per-slot price at the time of booking (audit trail)
    // Ensures old bookings show the original price even if admin changes it later
    slotPriceSnapshot: {
      type: Number,
      default: 0,
    },
    extraHours: {
      type: Number,
      default: 0,
    },
    extraAmount: {
      type: Number,
      default: 0,
    },
    // extraMinutes: exact extra time added (mirrors extraHours × 60 for display)
    extraMinutes: {
      type: Number,
      default: 0,
    },
    // extraSlotLabel: label for the extra time added ("30 Minutes", "1 Hour", etc.)
    extraSlotLabel: {
      type: String,
      default: '',
    },
    maxHourDiscount: {
      type: Number,
      default: 0,
    },
    zoneDiscount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    address: {
      locationText: { type: String, required: true, trim: true },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    basePrice: { type: Number, required: true },
    platformFee: { type: Number, required: true, default: 0 },
    taxes: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true, default: 0 },
    laborShare: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['ONLINE', 'CASH'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING',
    },
    adminSettlementStatus: {
      type: String,
      enum: ['PENDING', 'SETTLED'],
      default: 'PENDING',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'CREATED',
        'BROADCASTING',
        'ACCEPTED',
        'ASSIGNED',
        'EN_ROUTE',
        'STARTED',
        'COMPLETED',
        'CANCELLED',
        'REFUNDED',
        'FAILED',
      ],
      default: 'CREATED',
      index: true,
    },
    broadcastRadius: { type: Number },
    eligibleLabourCount: { type: Number, default: 0 },
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Support for Bulk Bookings (Contractor)
    quantity: { type: Number, default: 1, min: 1 },
    acceptedLabourIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Keep single acceptedLabourId for simple customer queries
    acceptedLabourId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Per-labourer assignments details for bulk
    assignments: [
      {
        labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourService' },
        serviceName: { type: String },          // snapshot of service name at booking time
        pricePerHour: { type: Number, default: 0 }, // snapshot of rate at booking time
        slotPrice: { type: Number, default: 0 },    // snapshot of slot price at booking time
        labourShare: { type: Number, default: 0 },  // calculated at acceptance time
        status: {
          type: String,
          enum: ['ACCEPTED', 'EN_ROUTE', 'STARTED', 'COMPLETED', 'REJECTED', 'CANCELLED'],
          default: 'ACCEPTED',
        },
        startOtp: String,
        completionOtp: String,
        startWorkImage: String,
        endWorkImage: String,
        startedAt: Date,
        completedAt: Date,
        extraHours: { type: Number, default: 0 },
        extraMinutes: { type: Number, default: 0 },
        extraAmount: { type: Number, default: 0 },
        extraSlotLabel: { type: String, default: '' },
      },
    ],

    // Contractor Specific Details
    contractorInfo: {
      companyName: String,
      gstNumber: String,
      projectName: String,
      siteContactNumber: String,
      services: [
        {
          serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourService' },
          quantity: Number,
          price: Number,       // hourly rate snapshot
          slotPrice: Number,   // slot price snapshot
        },
      ],
    },

    // Legacy fields (kept for backward compatibility or simple 1-to-1 bookings)
    startedAt: { type: Date },
    startOtp: { type: String },
    completionOtp: { type: String },
    startWorkImage: { type: String },
    endWorkImage: { type: String },
  },
  { timestamps: true }
)

bookingSchema.index({ 'address.coordinates': '2dsphere' })

export const Booking = mongoose.model('Booking', bookingSchema)
