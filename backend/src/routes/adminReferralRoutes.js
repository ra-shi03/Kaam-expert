import { Router } from 'express'
import { body, param } from 'express-validator'
import { protect, restrictTo } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { USER_ROLES } from '../constants/roles.js'
import * as referral from '../controllers/referralController.js'

const router = Router()

router.use(protect, restrictTo(USER_ROLES.ADMIN))

router.get('/', referral.listAdminReferrals)

router.patch(
  '/:id/approve',
  [param('id').isMongoId().withMessage('Invalid referral id')],
  validateRequest,
  referral.approveReferral,
)

router.patch(
  '/:id/reject',
  [
    param('id').isMongoId().withMessage('Invalid referral id'),
    body('reason').optional().isString().trim().isLength({ max: 300 }),
  ],
  validateRequest,
  referral.rejectReferral,
)

export default router
