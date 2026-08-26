import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import * as fcmTokenController from '../controllers/fcmTokenController.js'

const router = Router()

// All FCM token routes require authentication
router.use(protect)

router.post('/save', fcmTokenController.saveToken)
router.post('/mobile/save', fcmTokenController.saveToken) // Can use same controller, just pass platform='mobile' in body
router.delete('/remove', fcmTokenController.removeToken)
router.post('/test', fcmTokenController.testNotification)

export default router
