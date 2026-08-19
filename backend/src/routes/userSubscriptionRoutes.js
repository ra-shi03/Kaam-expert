import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth.js'
import { USER_ROLES } from '../constants/roles.js'
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMySubscription,
  checkLabourAccess,
} from '../controllers/userSubscriptionController.js'

const router = Router()

router.use(protect)

// Daily Subscriptions are only for LABOUR role
router.use(restrictTo(USER_ROLES.LABOUR))

router.get('/my-subscription', getMySubscription)
router.get('/check-access', checkLabourAccess)
router.post('/order', createRazorpayOrder)
router.post('/verify', verifyRazorpayPayment)

export default router
