import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth.js'
import { USER_ROLES } from '../constants/roles.js'
import * as zoneController from '../controllers/zoneController.js'

const router = Router()

// Only ADMIN can access these zone settings and stats
router.use(protect, restrictTo(USER_ROLES.ADMIN))

router.get('/', zoneController.getActiveZones)
router.get('/list', zoneController.getAllZones)
router.post('/', zoneController.createZone)
router.put('/:id', zoneController.updateZone)
router.patch('/:id/status', zoneController.toggleZoneStatus)
router.delete('/:id', zoneController.deleteZone)

router.get('/settings', zoneController.getZoneSettings)
router.put('/settings', zoneController.updateZoneSettings)
router.get('/statistics', zoneController.getZoneStatistics)

export default router
