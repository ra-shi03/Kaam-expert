import { Router } from 'express'
import { body } from 'express-validator'
import { protect, restrictTo } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { USER_ROLES } from '../constants/roles.js'
import { uploadMediaMulter } from '../middleware/uploadMiddleware.js'
import * as settings from '../controllers/systemSettingController.js'

const router = Router()

// Public route — returns public settings (no auth required)
router.get('/public', async (req, res) => {
  try {
    const { SystemSetting } = await import('../models/SystemSetting.js')
    const { sendSuccess } = await import('../utils/apiResponse.js')
    let cfg = await SystemSetting.findOne({ configKey: 'master_config' })
    const timeSlots = cfg?.timeSlots || ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM']
    const freeTrialMessage = cfg?.freeTrialMessage || 'Welcome! Enjoy your free trial period.'
    const kycReviewMessage = cfg?.kycReviewMessage ?? 'Usually reviewed within 1–2 business days.'
    const paymentModes = cfg?.paymentModes || { cashEnabled: true, onlineEnabled: true }
    const branding = cfg?.branding || { logoUrl: null, faviconUrl: null }
    const workingHoursPerDay = cfg?.workingHoursPerDay || 8
    // Only expose active duration options to public
    const durationOptions = (cfg?.durationOptions || [])
      .filter((d) => d.isActive)
      .sort((a, b) => a.minutes - b.minutes)
    // Lets the app hide Refer & earn entry points without an authenticated call
    const referral = {
      isEnabled: cfg?.referral?.isEnabled ?? true,
      showInApp: cfg?.referral?.showInApp ?? true,
    }
    return sendSuccess(res, {
      data: { timeSlots, freeTrialMessage, kycReviewMessage, paymentModes, branding, workingHoursPerDay, durationOptions, referral },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Could not load public settings' })
  }
})

// Only Admins can manage System Settings
router.use(protect, restrictTo(USER_ROLES.ADMIN))

router.get('/', settings.getSystemSettings)

router.patch(
  '/platform-fees',
  [
    body('type').optional().isIn(['fixed', 'percentage']),
    body('value').optional().isNumeric(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  settings.updatePlatformFees,
)

router.patch(
  '/commission',
  [
    body('type').optional().isIn(['global', 'category', 'service']),
    body('globalPercentage').optional().isNumeric(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  settings.updateCommission,
)

router.patch(
  '/labour-cash-limit',
  [
    body('labourCashLimit').isNumeric().withMessage('Labour cash limit is required'),
  ],
  validateRequest,
  settings.updateLabourCashLimit,
)



router.patch(
  '/gst',
  [
    body('gstPercentage').isNumeric().withMessage('GST percentage is required'),
  ],
  validateRequest,
  settings.updateGstPercentage,
)

router.patch(
  '/penalty',
  [
    body('cancellationPenalty').isNumeric().withMessage('Cancellation penalty is required'),
  ],
  validateRequest,
  settings.updateCancellationPenalty,
)

router.patch(
  '/time-slots',
  [
    body('timeSlots').isArray({ min: 1 }).withMessage('timeSlots must be a non-empty array'),
    body('timeSlots.*').isString().trim().notEmpty().withMessage('Each time slot must be a non-empty string'),
  ],
  validateRequest,
  settings.updateTimeSlots,
)

router.patch(
  '/user-subscription-toggle',
  [
    body('isUserSubscriptionEnabled').isBoolean().withMessage('isUserSubscriptionEnabled must be a boolean'),
  ],
  validateRequest,
  settings.updateUserSubscriptionToggle,
)

router.patch(
  '/kyc-review-message',
  [body('kycReviewMessage').isString().trim().isLength({ max: 300 }).withMessage('Message must be 300 characters or less')],
  validateRequest,
  settings.updateKycReviewMessage,
)

router.patch(
  '/dynamic-subscription',
  [
    body('dailySubscriptionPrice').optional().isNumeric(),
    body('freeTrialDays').optional().isNumeric(),
    body('freeTrialMessage').optional().isString().trim(),
    body('subscriptionStartHour').optional().isNumeric(),
    body('subscriptionEndHour').optional().isNumeric(),
  ],
  validateRequest,
  settings.updateDynamicSubscriptionSettings,
)

router.patch(
  '/max-hour-discount',
  [
    body('maxHourDiscountPercentage').isNumeric().withMessage('maxHourDiscountPercentage is required'),
  ],
  validateRequest,
  settings.updateMaxHourDiscount,
)

router.patch(
  '/payment-modes',
  [
    body('cashEnabled').optional().isBoolean(),
    body('onlineEnabled').optional().isBoolean(),
  ],
  validateRequest,
  settings.updatePaymentModes,
)

router.patch(
  '/referral',
  [
    body('isEnabled').optional().isBoolean(),
    body('showInApp').optional().isBoolean(),
    body('referrerReward').optional().isFloat({ min: 0, max: 100000 }).withMessage('referrerReward must be 0–100000'),
    body('refereeReward').optional().isFloat({ min: 0, max: 100000 }).withMessage('refereeReward must be 0–100000'),
    body('rewardTrigger').optional().isIn(['SIGNUP', 'FIRST_COMPLETED_JOB']),
  ],
  validateRequest,
  settings.updateReferralSettings,
)

router.patch(
  '/cash-wallet',
  [
    body('isEnabled').optional().isBoolean(),
    body('minBalance').optional().isFloat({ min: 0, max: 100000 }).withMessage('minBalance must be 0–100000'),
    body('minRecharge').optional().isInt({ min: 1, max: 100000 }).withMessage('minRecharge must be a whole number 1–100000'),
    body('maxRecharge').optional().isInt({ min: 1, max: 100000 }).withMessage('maxRecharge must be a whole number 1–100000'),
  ],
  validateRequest,
  settings.updateCashWalletSettings,
)

router.patch(
  '/bonus',
  [body('maxAmount').isInt({ min: 1, max: 1000000 }).withMessage('maxAmount must be a whole number 1–1000000')],
  validateRequest,
  settings.updateBonusSettings,
)

router.post(
  '/branding',
  uploadMediaMulter,
  [
    body('type').isIn(['logo', 'favicon']).withMessage('type must be logo or favicon'),
  ],
  validateRequest,
  settings.uploadBranding
)

router.delete(
  '/branding/:type',
  settings.deleteBranding
)

// ─── Duration Options & Working Hours ─────────────────────────────────────────

// GET all duration options (admin — includes inactive ones too)
router.get('/duration-options', settings.getDurationOptions)

// POST add a new custom duration slot
router.post(
  '/duration-options',
  [
    body('minutes').isInt({ min: 1, max: 1440 }).withMessage('Minutes must be between 1 and 1440'),
    body('label').optional().isString().trim(),
    body('tag').optional().isString().trim(),
  ],
  validateRequest,
  settings.addDurationOption,
)

// PATCH toggle active/inactive for a single duration slot by its minutes value
router.patch('/duration-options/:minutes/toggle', settings.toggleDurationOption)

// DELETE remove a custom duration slot
router.delete('/duration-options/:minutes', settings.deleteDurationOption)

// PATCH working hours per day (drives Half Day and Full Day slot minutes)
router.patch(
  '/working-hours',
  [
    body('workingHoursPerDay')
      .isNumeric().withMessage('workingHoursPerDay must be a number')
      .isFloat({ min: 1, max: 24 }).withMessage('Must be between 1 and 24'),
  ],
  validateRequest,
  settings.updateWorkingHours,
)

export default router
