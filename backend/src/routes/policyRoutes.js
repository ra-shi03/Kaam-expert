import { Router } from 'express'
import { getPolicy, updatePolicy } from '../controllers/policyController.js'
import { protect, restrictTo } from '../middleware/auth.js'
import { USER_ROLES } from '../constants/roles.js'

const router = Router()

// Public route to get policy content
router.get('/:type/:role', getPolicy)

// Admin route to update policy content
router.put(
  '/:type/:role',
  protect,
  restrictTo(USER_ROLES.ADMIN),
  updatePolicy
)

export default router
