import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth.js'
import { requireLabourSubscription } from '../middleware/requireLabourSubscription.js'
import { USER_ROLES, APP_ROLES } from '../constants/roles.js'
import {
  createRequest,
  listMyRequests,
  getRequest,
  mockPayRequest
} from '../controllers/requestController.js'
import {
  listLabourAssignments,
  respondToAssignment,
} from '../controllers/allocationController.js'
const router = Router()

router.use(protect)

router.post('/requests', restrictTo(USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR, USER_ROLES.ADMIN, 'super_admin'), createRequest)
router.get('/requests', restrictTo(...APP_ROLES, USER_ROLES.ADMIN, 'super_admin'), listMyRequests)
router.get('/requests/:id', restrictTo(...APP_ROLES, USER_ROLES.ADMIN), getRequest)
router.post('/requests/:id/mock-pay', restrictTo(USER_ROLES.CONTRACTOR, USER_ROLES.ADMIN, 'super_admin'), mockPayRequest)

router.get('/assignments', restrictTo(USER_ROLES.LABOUR), listLabourAssignments)
router.patch('/assignments/:id/respond', restrictTo(USER_ROLES.LABOUR), requireLabourSubscription, respondToAssignment)


export default router
