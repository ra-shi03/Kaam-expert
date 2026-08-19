import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth.js'
import { USER_ROLES } from '../constants/roles.js'
import {
  getLabourSubscriptions,
  getRefundEligible,
  getSubscriptionStats,
  getSubscriptionById,
  processAdminRefund,
  getRefundHistory,
} from '../controllers/adminSubscriptionController.js'

const router = Router()

// All routes are admin-only
router.use(protect, restrictTo(USER_ROLES.ADMIN))

router.get('/', getLabourSubscriptions)
router.get('/stats', getSubscriptionStats)
router.get('/refund-eligible', getRefundEligible)
router.get('/history', getRefundHistory)
router.get('/:id', getSubscriptionById)
router.patch('/:id/refund', processAdminRefund)

export default router
