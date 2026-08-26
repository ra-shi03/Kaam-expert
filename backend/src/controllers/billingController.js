

import mongoose from 'mongoose'
import { USER_ROLES } from '../constants/roles.js'
import { INVOICE_STATUS, REQUEST_STATUS } from '../constants/workforceConstants.js'

import { WorkforceRequest } from '../models/WorkforceRequest.js'
import { PricingRate } from '../models/PricingRate.js'
import { Invoice, generateInvoiceNumber } from '../models/Invoice.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'

export const listPricingRatesAdmin = asyncHandler(async (req, res) => {
  const rates = await PricingRate.find({ isActive: true }).sort({ createdAt: -1 }).lean()
  sendSuccess(res, { rates })
})

export const listInvoicesAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status) filter.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('contractorId', 'fullName email')
      .lean(),
    Invoice.countDocuments(filter),
  ])
  sendSuccess(res, { invoices, total, page: Number(page), limit: Number(limit) })
})

export const upsertPricingRateAdmin = asyncHandler(async (req, res) => {
  const { categoryId, clientType, contractorId, ratePerShift, workerRatePerShift, gstPercent } = req.body
  if (!mongoose.Types.ObjectId.isValid(categoryId) || ratePerShift == null) {
    return sendError(res, { message: 'categoryId and ratePerShift required', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  const rate = await PricingRate.create({
    categoryId,
    clientType: clientType || 'customer',
    contractorId: contractorId && mongoose.Types.ObjectId.isValid(contractorId) ? contractorId : undefined,
    ratePerShift: Number(ratePerShift),
    workerRatePerShift: workerRatePerShift != null ? Number(workerRatePerShift) : undefined,
    gstPercent: gstPercent != null ? Number(gstPercent) : 18,
  })
  sendSuccess(res, { rate }, HTTP_STATUS.CREATED)
})

async function resolveRate(categoryId, sourceType, contractorId) {
  let rate = null
  if (contractorId) {
    rate = await PricingRate.findOne({
      categoryId,
      contractorId,
      isActive: true,
    }).sort({ effectiveFrom: -1 })
  }
  if (!rate) {
    rate = await PricingRate.findOne({
      categoryId,
      clientType: sourceType,
      isActive: true,
      contractorId: { $exists: false },
    }).sort({ effectiveFrom: -1 })
  }
  return rate
}

export const generateInvoiceAdmin = asyncHandler(async (req, res) => {
  const { requestId } = req.body
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return sendError(res, { message: 'requestId required', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  const request = await WorkforceRequest.findById(requestId).lean()
  if (!request) return sendError(res, { message: 'Request not found', statusCode: HTTP_STATUS.NOT_FOUND })

  const duration = request.projectDurationDays || 1

  const lines = []
  let subtotal = 0
  let gstTotal = 0

  for (const line of request.lines || []) {
    const totalUnits = (line.quantity || 1) * duration
    const rate = await resolveRate(line.categoryId, request.sourceType, request.clientId)
    const ratePer = rate?.ratePerShift ?? 500
    const gstPct = rate?.gstPercent ?? 18
    const amount = totalUnits * ratePer * (line.quantity || 1)
    const gstAmount = (amount * gstPct) / 100
    lines.push({
      description: `Labour — ${line.quantity} workers`,
      categoryId: line.categoryId,
      billableUnits: totalUnits,
      ratePerUnit: ratePer,
      amount,
      gstAmount,
    })
    subtotal += amount
    gstTotal += gstAmount
  }



  const invoice = await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    contractorId: request.sourceType === 'contractor' ? request.clientId : undefined,
    requestId: request._id,
    projectId: request.projectId,
    type: 'fixed',
    billingMode: request.billingMode,
    status: INVOICE_STATUS.ISSUED,
    lines,
    subtotal,
    gstTotal,
    total: subtotal + gstTotal,
    issuedAt: new Date(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  })

  await WorkforceRequest.findByIdAndUpdate(requestId, { status: REQUEST_STATUS.BILLING })
  sendSuccess(res, { invoice }, HTTP_STATUS.CREATED)
})

export const patchInvoiceStatusAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body
  const invoice = await Invoice.findById(req.params.id)
  if (!invoice) return sendError(res, { message: 'Not found', statusCode: HTTP_STATUS.NOT_FOUND })
  if (status) invoice.status = status
  if (status === INVOICE_STATUS.PAID) invoice.paidAt = new Date()
  await invoice.save()
  sendSuccess(res, { invoice })
})
