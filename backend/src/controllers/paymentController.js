import { PaymentTransaction } from '../models/PaymentTransaction.js'
import { Booking } from '../models/Booking.js'
import { createOrder, verifyPaymentSignature } from '../services/paymentService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import { qualifyReferralsInBackground } from '../services/referralService.js'
import { creditEarnings, getCashWalletSettings, rechargeWallet, runInTransaction } from '../services/walletService.js'
import { USER_ROLES } from '../constants/roles.js'

/** Paid top-ups of the labour wallet. WALLET_CLEARANCE is the legacy "pay dues" purpose — same behaviour. */
const WALLET_TOPUP_PURPOSES = new Set(['WALLET_RECHARGE', 'WALLET_CLEARANCE'])

export const initPayment = asyncHandler(async (req, res) => {
  const { amount, purpose, bookingId } = req.body

  if (purpose === 'BOOKING' && !bookingId) {
    return sendError(res, { message: 'bookingId is required for BOOKING purpose', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  if (purpose === 'INVOICE' && !req.body.invoiceId) {
    return sendError(res, { message: 'invoiceId is required for INVOICE purpose', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  if (purpose === 'SUBSCRIPTION' && !req.body.planId) {
    return sendError(res, { message: 'planId is required for SUBSCRIPTION purpose', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  if (purpose === 'WORKFORCE_REQUEST' && !req.body.requestId) {
    return sendError(res, { message: 'requestId is required for WORKFORCE_REQUEST purpose', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  if (purpose === 'WALLET_RECHARGE') {
    if (req.user.role !== USER_ROLES.LABOUR) {
      return sendError(res, { message: 'Only labour accounts can recharge a wallet', statusCode: HTTP_STATUS.FORBIDDEN })
    }
    const { minRecharge, maxRecharge } = await getCashWalletSettings()
    const value = Number(amount)
    if (!Number.isInteger(value) || value < minRecharge || value > maxRecharge) {
      return sendError(res, {
        message: `Recharge amount must be a whole number between ₹${minRecharge} and ₹${maxRecharge}`,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_RECHARGE_AMOUNT',
      })
    }
  }

  const numericAmount = Math.max(1, Math.round(Number(amount) || 0))

  // Generate Razorpay Order
  const receiptId = `rcpt_${req.user._id.toString().slice(-4)}_${Date.now().toString().slice(-4)}`
  const order = await createOrder(numericAmount, 'INR', receiptId)

  // Record Transaction intent
  const pTx = await PaymentTransaction.create({
    userId: req.user._id,
    bookingId: purpose === 'BOOKING' ? bookingId : undefined,
    invoiceId: purpose === 'INVOICE' ? req.body.invoiceId : undefined,
    planId: purpose === 'SUBSCRIPTION' ? req.body.planId : undefined,
    requestId: purpose === 'WORKFORCE_REQUEST' ? req.body.requestId : undefined,
    razorpayOrderId: order.id,
    amount: numericAmount,
    purpose,
    status: 'CREATED'
  })

  return sendSuccess(res, { data: { order, paymentTransactionId: pTx._id } })
})

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

  const pTx = await PaymentTransaction.findOne({ razorpayOrderId })
  if (!pTx) {
    return sendError(res, { message: 'Payment transaction not found', statusCode: HTTP_STATUS.NOT_FOUND })
  }

  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

  if (!isValid) {
    // Never downgrade a payment that was already captured
    if (pTx.status !== 'CAPTURED') {
      pTx.status = 'FAILED'
      await pTx.save()
    }
    return sendError(res, { message: 'Payment verification failed', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const claim = (session) =>
    PaymentTransaction.findOneAndUpdate(
      { _id: pTx._id, status: { $ne: 'CAPTURED' } },
      { $set: { status: 'CAPTURED', razorpayPaymentId, razorpaySignature } },
      { new: true, session },
    )

  // Wallet top-up: capture + credit atomically, so a replayed verify can never credit twice
  if (WALLET_TOPUP_PURPOSES.has(pTx.purpose)) {
    if (String(pTx.userId) !== String(req.user._id)) {
      return sendError(res, { message: 'This payment belongs to another account', statusCode: HTTP_STATUS.FORBIDDEN })
    }
    const credited = await runInTransaction(async (session) => {
      const claimed = await claim(session)
      if (!claimed) return null
      const { summary } = await rechargeWallet({ userId: pTx.userId, amount: pTx.amount, referenceId: pTx._id, session })
      return { claimed, summary }
    })
    return sendSuccess(res, {
      message: credited ? 'Wallet recharged successfully' : 'Payment already verified',
      data: { pTx: credited?.claimed ?? pTx, walletSummary: credited?.summary ?? null },
    })
  }

  // Claim first so a replayed verify can never run the side effects below twice
  const captured = await claim()
  if (!captured) {
    return sendSuccess(res, { message: 'Payment already verified', data: { pTx } })
  }

  // Handle side-effects based on purpose
  if (pTx.purpose === 'BOOKING' && pTx.bookingId) {
    const booking = await Booking.findById(pTx.bookingId)
    if (booking) {
      const alreadyPaid = booking.paymentStatus === 'PAID'
      booking.paymentStatus = 'PAID'
      await booking.save()
      
      // In Phase 4, Online Payment commission handling:
      // Since platform receives the money, the labor's selfWallet is credited the laborShare
      // (skipped if an earlier order already paid this booking, so the worker is never paid twice)
      if (booking.status === 'COMPLETED' && !alreadyPaid) {
         if (booking.assignments && booking.assignments.length > 0) {
           for (const a of booking.assignments) {
             if (a.status === 'COMPLETED' && a.labourId) {
               const lid = typeof a.labourId === 'object' ? a.labourId._id : a.labourId;
               let workerShare = a.labourShare || (booking.laborShare ? Math.round(booking.laborShare / (booking.quantity || 1)) : 0)
               if (booking.contractorInfo?.services?.length > 0) {
                 const s = booking.contractorInfo.services.find(svc => String(svc.serviceId?._id || svc.serviceId) === String(a.serviceId?._id || a.serviceId))
                 if (s && s.price) {
                   const hrs = (booking.duration || booking.hours || 1) + (a.extraHours || 0)
                   workerShare = (s.price * hrs) * 0.9
                 }
               }
               if (workerShare > 0) {
                 // Credits recover any outstanding cash-job dues first (Rapido-style single wallet)
                 await creditEarnings({
                   userId: lid,
                   amount: workerShare,
                   context: 'PAYOUT',
                   referenceId: booking._id,
                   description: 'Online Payment Payout for Completed Assignment'
                 })
               }
             }
           }
         } else if (booking.laborId && booking.laborShare > 0) {
           await creditEarnings({
             userId: booking.laborId,
             amount: booking.laborShare,
             context: 'PAYOUT',
             referenceId: booking._id,
             description: 'Online Payment Payout for Booking'
           })
         }
         
         // Notify both labour and client
         import('../socket.js').then(({ emitToUser }) => {
           if (booking.laborId) emitToUser(booking.laborId, 'BOOKING_STATUS_UPDATE', { bookingId: booking._id, status: booking.status, paymentStatus: 'PAID' })
           emitToUser(booking.clientId, 'BOOKING_STATUS_UPDATE', { bookingId: booking._id, status: booking.status, paymentStatus: 'PAID' })
           if (booking.assignments && booking.assignments.length > 0) {
             booking.assignments.forEach(a => {
               const lid = typeof a.labourId === 'object' ? a.labourId._id : a.labourId;
               if (lid) emitToUser(lid, 'BOOKING_STATUS_UPDATE', { bookingId: booking._id, status: booking.status, paymentStatus: 'PAID' });
             });
           }
         }).catch(err => console.error('Failed to emit payment status socket', err))
      }
    }
  } else if (pTx.purpose === 'INVOICE' && pTx.invoiceId) {
    const Invoice = (await import('../models/Invoice.js')).Invoice
    const invoice = await Invoice.findById(pTx.invoiceId)
    if (invoice) {
      invoice.status = 'paid'
      invoice.paidAt = new Date()
      await invoice.save()
    }
  } else if (pTx.purpose === 'SUBSCRIPTION' && pTx.planId) {
    const VendorSubscription = (await import('../models/VendorSubscription.js')).VendorSubscription
    const SubscriptionPlan = (await import('../models/SubscriptionPlan.js')).SubscriptionPlan
    const plan = await SubscriptionPlan.findById(pTx.planId)
    if (plan) {
      const durationLower = plan.duration?.toLowerCase() || ''
      let days = 30
      if (durationLower.includes('year')) days = 365
      else if (durationLower.includes('quarter')) days = 90
      
      await VendorSubscription.create({
        vendor: req.user._id,
        plan: plan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      })
    }
  } else if (pTx.purpose === 'WORKFORCE_REQUEST' && pTx.requestId) {
    const WorkforceRequest = (await import('../models/WorkforceRequest.js')).WorkforceRequest
    const Invoice = (await import('../models/Invoice.js')).Invoice
    const Assignment = (await import('../models/Assignment.js')).Assignment
    
    const request = await WorkforceRequest.findById(pTx.requestId)
    if (request) {
      const baseAmount = (request.lines || []).reduce((sum, l) => sum + (l.adminPrice || 500) * (l.quantity || 1), 0)
      
      request.paymentStatus = 'PAID'
      request.status = 'completed'
      request.totalAmount = pTx.amount
      request.platformFee = pTx.amount - baseAmount - (request.taxAmount || 0)
      await request.save()
      
      const { generateInvoiceNumber } = await import('../models/Invoice.js')
      const existingInvoice = await Invoice.findOne({ requestId: request._id, contractorId: request.clientId })
      
      if (!existingInvoice) {
        await Invoice.create({
          invoiceNumber: generateInvoiceNumber(),
          contractorId: request.clientId,
          requestId: request._id,
          projectId: request.projectId,
          type: 'advance',
          status: 'paid',
          paidAt: new Date(),
          total: pTx.amount || 0,
          subtotal: baseAmount || 0,
          gstTotal: request.taxAmount || 0,
          lines: (request.lines || []).map(l => ({
            description: `Booking for ${l.quantity || 1}x Labour`,
            categoryId: l.categoryId,
            billableUnits: l.quantity || 1,
            amount: (l.adminPrice || 500) * (l.quantity || 1)
          }))
        })
      } else {
        await Invoice.updateMany({ requestId: request._id }, { status: 'paid', paidAt: new Date() })
      }
      
      await Assignment.updateMany({ requestId: request._id }, { status: 'COMPLETED' })

      const workerIds = await Assignment.distinct('labourId', { requestId: request._id })
      qualifyReferralsInBackground(request.clientId, ...workerIds)

      if (request.sourceType === 'contractor') {
        const UserSubscription = (await import('../models/UserSubscription.js')).UserSubscription
        const activeSub = await UserSubscription.findOne({ user: request.clientId, status: 'active' })
        if (activeSub) {
          activeSub.bookingsUsed += 1
          await activeSub.save()
        }
      }
    }
  }

  return sendSuccess(res, { message: 'Payment verified successfully', data: { pTx: captured } })
})
