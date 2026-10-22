import { Router } from 'express'
import { param } from 'express-validator'
import { protect, restrictTo } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { APP_ROLES } from '../constants/roles.js'
import * as referral from '../controllers/referralController.js'

const router = Router()

router.get(
  '/validate/:code',
  [param('code').trim().isLength({ min: 4, max: 16 }).isAlphanumeric().withMessage('Invalid referral code')],
  validateRequest,
  referral.validateReferralCode,
)

router.get('/me', protect, restrictTo(...APP_ROLES), referral.getMyReferrals)

export default router
