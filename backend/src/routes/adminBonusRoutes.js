import { Router } from 'express'
import { body, header, param, query } from 'express-validator'
import { protect, restrictTo } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { USER_ROLES } from '../constants/roles.js'
import { BONUS_STATUS, BONUS_TYPES } from '../models/Bonus.js'
import * as bonus from '../controllers/adminBonusController.js'

const router = Router()

router.use(protect, restrictTo(USER_ROLES.ADMIN))

router.get(
  '/',
  [
    query('status').optional().isIn(Object.values(BONUS_STATUS)).withMessage('Invalid bonus status'),
    query('bonusType').optional().isIn(BONUS_TYPES).withMessage('Invalid bonus type'),
    query('labourId').optional().isMongoId().withMessage('Invalid labour id'),
    query('from').optional().isISO8601().withMessage('Invalid start date'),
    query('to').optional().isISO8601().withMessage('Invalid end date'),
  ],
  validateRequest,
  bonus.listBonuses,
)

router.get('/:id', [param('id').isMongoId().withMessage('Invalid bonus id')], validateRequest, bonus.getBonus)

router.post(
  '/',
  [
    header('Idempotency-Key')
      .isString()
      .isLength({ min: 8, max: 128 })
      .withMessage('Idempotency-Key header (8–128 chars) is required'),
    body('labourId').isMongoId().withMessage('Select a valid labour'),
    body('amount').isInt({ min: 1 }).withMessage('Bonus amount must be a whole number of rupees').toInt(),
    body('bonusType').isIn(BONUS_TYPES).withMessage('Invalid bonus type'),
    body('reason').isString().trim().notEmpty().withMessage('Reason is required').isLength({ max: 500 }),
    body('internalNote').optional({ values: 'falsy' }).isString().trim().isLength({ max: 1000 }),
  ],
  validateRequest,
  bonus.createBonusHandler,
)

router.patch(
  '/:id/reverse',
  [
    param('id').isMongoId().withMessage('Invalid bonus id'),
    body('reason').isString().trim().notEmpty().withMessage('A reason is required to reverse a bonus').isLength({ max: 500 }),
  ],
  validateRequest,
  bonus.reverseBonusHandler,
)

export default router
