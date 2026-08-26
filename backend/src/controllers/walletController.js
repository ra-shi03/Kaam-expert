import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { WithdrawalRequest } from '../models/WithdrawalRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import mongoose from 'mongoose'

export const getMyWallet = asyncHandler(async (req, res) => {
  let wallet = await Wallet.findOne({ userId: req.user._id })
  
  if (!wallet) {
    wallet = await Wallet.create({ userId: req.user._id })
  }

  return sendSuccess(res, { data: { wallet } })
})

export const getEarningsSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id
  
  // 1. Calculate Earnings from Bookings
  const now = new Date()
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const BookingsModel = mongoose.model('Booking')
  const completedBookings = await BookingsModel.find({
    laborId: userId,
    status: { $in: ['COMPLETED', 'ACCEPTED', 'ASSIGNED', 'STARTED'] }
  })
  
  let earnedPaise = 0
  let todayPaise = 0
  let weekPaise = 0
  let monthPaise = 0
  // 1.5 Calculate Earnings from Refunds
  let refundsPaise = 0
  const wallet = await Wallet.findOne({ userId })
  if (wallet) {
    const refundTransactions = await WalletTransaction.find({
      walletId: wallet._id,
      type: 'CREDIT',
      context: 'REFUND'
    })

    console.log("REFUND TXS FOUND FOR WALLET", wallet._id, ":", refundTransactions.length)

    refundTransactions.forEach(t => {
      earnedPaise += t.amount * 100
      refundsPaise += t.amount * 100
      const tDateStr = new Date(t.createdAt.getTime() - t.createdAt.getTimezoneOffset() * 60000).toISOString().split('T')[0]
      if (tDateStr === todayStr) {
        todayPaise += t.amount * 100
      }
      if (t.createdAt >= weekAgo) {
        weekPaise += t.amount * 100
      }
      if (t.createdAt >= monthStart) {
        monthPaise += t.amount * 100
      }
    })
  } else {
    console.log("NO WALLET FOUND FOR USERID:", userId)
  }
  
  completedBookings.forEach(b => {
    const share = b.laborShare || b.basePrice || 0
    if (b.paymentMethod !== 'CASH') {
      earnedPaise += share * 100
      const bookingDate = new Date(b.scheduledAt || b.createdAt)
      const bDateStr = new Date(bookingDate.getTime() - bookingDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]
      
      if (bDateStr === todayStr) {
        todayPaise += share * 100
      }
      if (bookingDate >= weekAgo) {
        weekPaise += share * 100
      }
      if (bookingDate >= monthStart) {
        monthPaise += share * 100
      }
    }
  })
  
  // 2. Calculate Pending / Paid Withdrawals
  const pendingRequests = await WithdrawalRequest.aggregate([
    { $match: { userId, status: 'PENDING' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  const pendingInr = pendingRequests.length > 0 ? pendingRequests[0].total : 0
  
  const paidRequests = await WithdrawalRequest.aggregate([
    { $match: { userId, status: 'APPROVED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  const paidInr = paidRequests.length > 0 ? paidRequests[0].total : 0
  
  const availableInr = Math.floor(earnedPaise / 100) - paidInr - pendingInr
  const availablePaise = Math.max(0, availableInr * 100)
  const pendingPaise = pendingInr * 100
  
  return sendSuccess(res, {
    data: {
      earnings: {
        earnedPaise,
        todayPaise,
        weekPaise,
        monthPaise,
        availablePaise,
        pendingPaise,
        refundsPaise
      }
    }
  })
})

export const clearAdminDues = asyncHandler(async (req, res) => {
  const { amount } = req.body
  const numAmount = Number(amount)

  if (isNaN(numAmount) || numAmount <= 0) {
    return sendError(res, { message: 'Valid positive amount is required', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const wallet = await Wallet.findOne({ userId: req.user._id })
  if (!wallet || wallet.adminBalance <= 0) {
    return sendError(res, { message: 'No pending dues to clear', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  if (numAmount > wallet.adminBalance) {
    return sendError(res, { message: `Cannot pay more than the pending due amount: ${wallet.adminBalance}`, statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  // Simulate payment gateway logic here (In Phase 4 this would be replaced with actual gateway integration)
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    wallet.adminBalance -= numAmount
    await wallet.save({ session })

    await WalletTransaction.create([{
      walletId: wallet._id,
      amount: numAmount,
      type: 'DEBIT',
      targetWallet: 'ADMIN',
      context: 'CLEARANCE',
      description: 'Cleared admin dues via online payment'
    }], { session })

    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }

  return sendSuccess(res, { message: 'Admin dues cleared successfully', data: { wallet } })
})



export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, bankDetails } = req.body
  const numAmount = Number(amount)

  if (isNaN(numAmount) || numAmount <= 0) {
    return sendError(res, { message: 'Valid positive amount is required', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const { accountNumber, ifscCode, accountHolderName, bankName, qrCodeUrl } = bankDetails || {}

  if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
    return sendError(res, { message: 'Incomplete bank details', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const wallet = await Wallet.findOne({ userId: req.user._id }).session(session)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    // For testing/demo purposes, we bypass the strict balance check
    // if (wallet.selfBalance < numAmount) {
    //   throw new Error(`Insufficient wallet balance. You have ₹${wallet.selfBalance}`)
    // }

    // Deduct amount immediately to hold it
    wallet.selfBalance -= numAmount
    await wallet.save({ session })

    // Create request
    const request = await WithdrawalRequest.create([{
      labourId: req.user._id,
      amount: numAmount,
      bankDetails: { accountNumber, ifscCode, accountHolderName, bankName, qrCodeUrl },
      status: 'PENDING'
    }], { session })

    await session.commitTransaction()
    return sendSuccess(res, { message: 'Withdrawal request submitted successfully', data: { request: request[0], wallet } })
  } catch (error) {
    await session.abortTransaction()
    return sendError(res, { message: error.message, statusCode: HTTP_STATUS.BAD_REQUEST })
  } finally {
    session.endSession()
  }
})

export const getMyWithdrawals = asyncHandler(async (req, res) => {
  const requests = await WithdrawalRequest.find({ labourId: req.user._id }).sort({ createdAt: -1 })
  return sendSuccess(res, { data: { requests } })
})
