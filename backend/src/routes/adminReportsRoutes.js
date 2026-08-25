import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth.js'
import { USER_ROLES } from '../constants/roles.js'
import * as adminReports from '../controllers/adminReportsController.js'

const router = Router()

// Protect all routes
router.use(protect, restrictTo(USER_ROLES.ADMIN))

// GET /api/v1/admin/reports/stats
router.get('/stats', adminReports.getDashboardStats)

// GET /api/v1/admin/reports/data
router.get('/data', adminReports.getReportsData)

export default router
