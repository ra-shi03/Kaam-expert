import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import * as fcmTokenController from '../controllers/fcmTokenController.js'

const router = Router()

router.use(protect)

// Alias for old mobile app endpoints
router.post('/token', fcmTokenController.saveToken)

export default router
