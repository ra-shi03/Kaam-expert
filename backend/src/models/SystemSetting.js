import mongoose from 'mongoose'

const platformFeeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true,
      default: 'fixed',
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
)

const commissionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['global', 'category', 'service'],
      required: true,
      default: 'global',
    },
    globalPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    // Allows overriding commission per category if needed in future, currently just global is managed here
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
)

const systemSettingSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      unique: true,
      required: true,
      index: true,
      default: 'master_config',
    },
    platformFee: {
      type: platformFeeSchema,
      default: () => ({}),
    },
    commission: {
      type: commissionSchema,
      default: () => ({}),
    },
    paymentModes: {
      cashEnabled: { type: Boolean, default: true },
      onlineEnabled: { type: Boolean, default: true },
    },
    labourCashLimit: {
      type: Number,
      min: 0,
      default: 500,
    },
    cancellationPenalty: {
      type: Number,
      min: 0,
      default: 50,
    },
    globalBroadcastRadius: {
      type: Number,
      min: 1,
      default: 10,
    },
    // Booking start times (existing — untouched)
    timeSlots: {
      type: [String],
      default: ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'],
    },
    dailySubscriptionPrice: { type: Number, default: 19 },
    freeTrialDays: { type: Number, default: 3 },
    freeTrialMessage: { type: String, default: 'Welcome! Enjoy your free trial period.' },
    subscriptionStartHour: { type: Number, default: 8 },  // 8 AM
    subscriptionEndHour: { type: Number, default: 20 },   // 8 PM
    maxHourDiscountPercentage: { type: Number, default: 10 },
    isUserSubscriptionEnabled: { type: Boolean, default: false },
    /**
     * Refer & earn program. Rewards (INR) are credited to both wallets.
     * rewardTrigger: SIGNUP → credit immediately on registration;
     *                FIRST_COMPLETED_JOB → credit when the new user's first booking/job completes.
     * showInApp: whether the Refer & earn screen and its entry points are visible in the user/labour app.
     */
    referral: {
      isEnabled: { type: Boolean, default: true },
      showInApp: { type: Boolean, default: true },
      referrerReward: { type: Number, min: 0, default: 50 },
      refereeReward: { type: Number, min: 0, default: 25 },
      rewardTrigger: {
        type: String,
        enum: ['SIGNUP', 'FIRST_COMPLETED_JOB'],
        default: 'FIRST_COMPLETED_JOB',
      },
    },
    /**
     * Rapido-style prepaid cash rule for individual labour.
     * When enabled, a labourer can only accept a CASH booking if their wallet balance covers that job's
     * platform fee (+ minBalance). The fee is deducted from the wallet once the customer pays cash.
     */
    cashWallet: {
      isEnabled: { type: Boolean, default: true },
      minBalance: { type: Number, min: 0, default: 0 },
      minRecharge: { type: Number, min: 1, default: 100 },
      maxRecharge: { type: Number, min: 1, default: 10000 },
    },
    bonus: {
      /** Upper limit for a single admin bonus (₹) */
      maxAmount: { type: Number, min: 1, default: 10000 },
    },
    branding: {
      logoUrl: { type: String, default: null },
      faviconUrl: { type: String, default: null },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    /**
     * Working hours per day for the platform (admin-configurable).
     * Determines what Half Day and Full Day mean:
     *   Half Day minutes = (workingHoursPerDay / 2) * 60
     *   Full Day minutes = workingHoursPerDay * 60
     *
     * Example:
     *   workingHoursPerDay=8  → Half Day=4 hrs, Full Day=8 hrs
     *   workingHoursPerDay=12 → Half Day=6 hrs, Full Day=12 hrs
     *   workingHoursPerDay=6  → Half Day=3 hrs, Full Day=6 hrs
     *
     * Pre-save hook below keeps durationOptions half_day/full_day entries in sync.
     */
    workingHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 24,
    },

    /**
     * Global master list of service duration options shown in booking UI.
     * Admin can toggle isActive per slot.
     * Half Day / Full Day minutes auto-recompute from workingHoursPerDay.
     * tag: 'half_day' | 'full_day' | null — used to map to durationKind.
     */
    durationOptions: {
      type: [
        {
          minutes:   { type: Number, required: true },
          label:     { type: String, required: true },
          tag:       { type: String, enum: ['half_day', 'full_day', null], default: null },
          isActive:  { type: Boolean, default: true },
          sortOrder: { type: Number, default: 0 },
          _id: false,
        },
      ],
      default: () => [
        { minutes: 10,   label: '10 Minutes',       tag: null,       isActive: true, sortOrder: 1  },
        { minutes: 25,   label: '25 Minutes',       tag: null,       isActive: true, sortOrder: 2  },
        { minutes: 30,   label: '30 Minutes',       tag: null,       isActive: true, sortOrder: 3  },
        { minutes: 45,   label: '45 Minutes',       tag: null,       isActive: true, sortOrder: 4  },
        { minutes: 60,   label: '1 Hour',           tag: null,       isActive: true, sortOrder: 5  },
        { minutes: 75,   label: '1 Hr 15 Min',      tag: null,       isActive: true, sortOrder: 6  },
        { minutes: 80,   label: '1 Hr 20 Min',      tag: null,       isActive: true, sortOrder: 7  },
        { minutes: 90,   label: '1 Hr 30 Min',      tag: null,       isActive: true, sortOrder: 8  },
        { minutes: 105,  label: '1 Hr 45 Min',      tag: null,       isActive: true, sortOrder: 9  },
        { minutes: 120,  label: '2 Hours',          tag: null,       isActive: true, sortOrder: 10 },
        { minutes: 150,  label: '2 Hrs 30 Min',     tag: null,       isActive: true, sortOrder: 11 },
        { minutes: 180,  label: '3 Hours',          tag: null,       isActive: true, sortOrder: 12 },
        { minutes: 240,  label: '4 Hours',          tag: null,       isActive: true, sortOrder: 13 },
        { minutes: 300,  label: '5 Hours',          tag: null,       isActive: true, sortOrder: 14 },
        { minutes: 360,  label: 'Half Day (6 hrs)', tag: 'half_day', isActive: true, sortOrder: 15 },
        { minutes: 480,  label: '8 Hours',          tag: null,       isActive: true, sortOrder: 16 },
        { minutes: 600,  label: '10 Hours',         tag: null,       isActive: true, sortOrder: 17 },
        { minutes: 720,  label: 'Full Day (12 hrs)',tag: 'full_day', isActive: true, sortOrder: 18 },
        { minutes: 1440, label: '24 Hours',         tag: null,       isActive: true, sortOrder: 19 },
      ],
    },
  },
  { timestamps: true }
)

/**
 * Pre-save hook: keep Half Day and Full Day slot minutes + labels in sync
 * with workingHoursPerDay whenever that field changes.
 */
systemSettingSchema.pre('save', function (next) {
  if (this.isModified('workingHoursPerDay') || this.isNew) {
    const whpd = this.workingHoursPerDay || 8
    const halfHrs = whpd / 2
    const halfMins = Math.round(halfHrs * 60)
    const fullMins = whpd * 60

    if (Array.isArray(this.durationOptions)) {
      for (const opt of this.durationOptions) {
        if (opt.tag === 'half_day') {
          opt.minutes = halfMins
          opt.label = `Half Day (${halfHrs % 1 === 0 ? halfHrs : halfHrs.toFixed(1)} hrs)`
        } else if (opt.tag === 'full_day') {
          opt.minutes = fullMins
          opt.label = `Full Day (${whpd} hrs)`
        }
      }
      // Keep sorted by minutes after changes
      this.durationOptions.sort((a, b) => a.minutes - b.minutes)
    }
  }
  next()
})

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema)
