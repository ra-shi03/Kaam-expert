import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import * as fcmTokenController from '../controllers/fcmTokenController.js'

const router = Router()

// All FCM token routes require authentication
router.use(protect)

router.post('/save', fcmTokenController.saveToken)
// Native Android / iOS apps: tokens go to fcmTokenMobile (platform defaults to 'android'; send 'ios' for iPhones)
router.post('/mobile/save', (req, res, next) => {
  req.body = { ...req.body, platform: req.body?.platform && req.body.platform !== 'web' ? req.body.platform : 'android' }
  next()
}, fcmTokenController.saveToken)
router.delete('/remove', fcmTokenController.removeToken)
router.post('/test', fcmTokenController.testNotification)

export default router
