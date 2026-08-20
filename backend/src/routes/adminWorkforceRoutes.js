import { Router } from 'express'
import { protect, restrictTo } from '../middleware/auth.js'
import { USER_ROLES } from '../constants/roles.js'
import {
  listAdminRequests,
  patchRequestStatusAdmin,
  deleteAdminRequest,
  getRequest,
} from '../controllers/requestController.js'
import {
  createAllocationAdmin,
  replaceAssignmentAdmin,
} from '../controllers/allocationController.js'

import {
  listPricingRatesAdmin,
  upsertPricingRateAdmin,
  listInvoicesAdmin,
  generateInvoiceAdmin,
  patchInvoiceStatusAdmin,
} from '../controllers/billingController.js'

const router = Router()

router.use(protect, restrictTo(USER_ROLES.ADMIN))

router.get('/requests', listAdminRequests)
router.get('/requests/:id', getRequest)
router.patch('/requests/:id/status', patchRequestStatusAdmin)
router.delete('/requests/:id', deleteAdminRequest)

router.post('/allocations', createAllocationAdmin)
router.post('/assignments/:id/replace', replaceAssignmentAdmin)


router.get('/pricing', listPricingRatesAdmin)
router.post('/pricing', upsertPricingRateAdmin)
router.get('/invoices', listInvoicesAdmin)
router.post('/invoices/generate', generateInvoiceAdmin)
router.patch('/invoices/:id', patchInvoiceStatusAdmin)

export default router
