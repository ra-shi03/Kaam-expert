import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import * as fcmTokenController from '../controllers/fcmTokenController.js'
import * as notificationController from '../controllers/notificationController.js'

const router = Router()

router.use(protect)

// Alias for old mobile app endpoints
router.post('/token', (req, res, next) => {
  req.body = { ...req.body, platform: req.body?.platform && req.body.platform !== 'web' ? req.body.platform : 'android' }
  next()
}, fcmTokenController.saveToken)

// In-app notification inbox
router.get('/', notificationController.listNotifications)
router.get('/unread-count', notificationController.unreadCount)
router.post('/read-all', notificationController.markAllRead)
router.post('/:id/read', notificationController.markRead)

export default router
