import { WithdrawalRequest } from '../models/WithdrawalRequest.js'
import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { USER_ROLES } from '../constants/roles.js'
import { getCashWalletSettings, listWalletTransactions, summarizeWallet } from '../services/walletService.js'

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * GET /admin/wallets/labours?search=&filter=all|dues|low|recharged&page=&limit=
 * Labour wallets with their Rapido-style balance. `stats` cover all labour wallets (ignores filter/search).
 */
export const listLabourWallets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
  const filter = ['dues', 'low', 'recharged'].includes(req.query.filter) ? req.query.filter : 'all'
  const { minBalance, isEnabled: cashRuleEnabled } = await getCashWalletSettings()

  const searchMatch = {}
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : ''
  if (search) {
    const or = [{ fullName: new RegExp(escapeRegex(search), 'i') }]
    const digits = search.replace(/\D/g, '')
    if (digits.length >= 2) or.push({ phone: { $regex: digits } })
    searchMatch.$or = or
  }

  const filterStage = {
    all: {},
    dues: { _balance: { $lt: 0 } },
    low: { _balance: { $lte: minBalance } },
    recharged: { _recharge: { $gt: 0 } },
  }[filter]

  const [result] = await User.aggregate([
    { $match: { role: USER_ROLES.LABOUR } },
    { $lookup: { from: Wallet.collection.name, localField: '_id', foreignField: 'userId', as: 'wallet' } },
    { $unwind: { path: '$wallet', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        _earnings: { $ifNull: ['$wallet.selfBalance', 0] },
        _recharge: { $ifNull: ['$wallet.rechargeBalance', 0] },
        _dues: { $ifNull: ['$wallet.adminBalance', 0] },
      },
    },
    { $addFields: { _balance: { $subtract: [{ $add: ['$_earnings', '$_recharge'] }, '$_dues'] } } },
    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              rechargeHeld: { $sum: '$_recharge' },
              outstandingDues: { $sum: { $cond: [{ $lt: ['$_balance', 0] }, { $multiply: ['$_balance', -1] }, 0] } },
              inDues: { $sum: { $cond: [{ $lt: ['$_balance', 0] }, 1, 0] } },
              cannotTakeCash: { $sum: { $cond: [{ $lte: ['$_balance', minBalance] }, 1, 0] } },
            },
          },
        ],
        items: [
          { $match: { ...searchMatch, ...filterStage } },
          { $sort: { _balance: 1, fullName: 1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              fullName: 1,
              phone: 1,
              isActive: 1,
              'labourProfile.kycStatus': 1,
              wallet: { selfBalance: 1, rechargeBalance: 1, adminBalance: 1, updatedAt: 1 },
            },
          },
        ],
        total: [{ $match: { ...searchMatch, ...filterStage } }, { $count: 'n' }],
      },
    },
  ])

  const total = result.total[0]?.n || 0
  const stats = result.stats[0] || { rechargeHeld: 0, outstandingDues: 0, inDues: 0, cannotTakeCash: 0 }
  delete stats._id

  return sendSuccess(res, {
    data: {
      items: result.items.map((u) => ({ ...u, summary: summarizeWallet(u.wallet) })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats,
      minBalance,
      cashRuleEnabled,
    },
  })
})

/** GET /admin/wallets/labours/:userId/transactions — one labourer's wallet statement */
export const getLabourWalletTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
  const [labour, wallet, ledger] = await Promise.all([
    User.findById(req.params.userId).select('fullName phone role').lean(),
    Wallet.findOne({ userId: req.params.userId }).lean(),
    listWalletTransactions(req.params.userId, { page, limit }),
  ])
  if (!labour) return sendError(res, { message: 'User not found', statusCode: HTTP_STATUS.NOT_FOUND })
  return sendSuccess(res, { data: { labour, summary: summarizeWallet(wallet), ...ledger } })
})

export const getAllWithdrawalRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const query = status ? { status } : {}
  const skip = (Number(page) - 1) * Number(limit)

  const requests = await WithdrawalRequest.find(query)
    .populate('labourId', 'fullName phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  const total = await WithdrawalRequest.countDocuments(query)

  return sendSuccess(res, {
    data: {
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  })
})

export const getAllVendorWithdrawalRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const query = status ? { status, vendorId: { $exists: true } } : { vendorId: { $exists: true } }
  const skip = (Number(page) - 1) * Number(limit)

  const requests = await WithdrawalRequest.find(query)
    .populate('vendorId', 'fullName phone companyName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  const total = await WithdrawalRequest.countDocuments(query)

  return sendSuccess(res, {
    data: {
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    },
  })
})

export const getVendorWalletStats = asyncHandler(async (req, res) => {
  const { Invoice } = await import('../models/Invoice.js')
  
  // 1. Get all vendor invoices
  const invoices = await Invoice.find({ vendorId: { $exists: true }, type: 'fixed' }).lean()
  
  // 2. Get all vendor withdrawals
  const withdrawals = await WithdrawalRequest.find({ vendorId: { $exists: true } }).lean()
  
  // 3. Calculate total booked amount
  let totalBooked = 0
  const balanceMap = new Map()

  invoices.forEach(inv => {
    const amount = inv.total || inv.totalAmount || 0
    totalBooked += amount
    const vId = inv.vendorId.toString()
    balanceMap.set(vId, (balanceMap.get(vId) || 0) + amount)
  })

  let totalPaidOut = 0
  let pendingAmount = 0

  withdrawals.forEach(w => {
    if (w.status === 'APPROVED') {
      totalPaidOut += (w.amount || 0)
      const vId = w.vendorId.toString()
      if (balanceMap.has(vId)) {
        balanceMap.set(vId, Math.max(0, balanceMap.get(vId) - w.amount))
      }
    } else if (w.status === 'PENDING') {
      pendingAmount += (w.amount || 0)
    }
  })

  const totalUnpaid = Math.max(0, totalBooked - totalPaidOut)

  // Populate vendor names for top balances
  const { User } = await import('../models/User.js')
  const vendorIds = Array.from(balanceMap.keys())
  const vendors = await User.find({ _id: { $in: vendorIds } }, 'fullName companyName').lean()
  
  const vendorNameMap = {}
  vendors.forEach(v => {
    vendorNameMap[v._id.toString()] = v.companyName || v.fullName || 'Unknown Vendor'
  })

  const topBalances = Array.from(balanceMap.entries())
    .map(([vId, balance]) => ({ name: vendorNameMap[vId] || 'Unknown Vendor', balance }))
    .filter(v => v.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)

  sendSuccess(res, {
    data: {
      stats: {
        totalUnpaid,
        pendingAmount,
        totalPaidOut,
        vendorBalances: topBalances
      }
    }
  })
})

export const getCollectedCommissionAmount = asyncHandler(async (req, res) => {
  const { AdminWallet } = await import('../models/AdminWallet.js')
  let adminWallet = await AdminWallet.findOne().lean()

  if (!adminWallet) {
    adminWallet = {
      totalCommissionsCollected: 0,
      totalPlatformFeesCollected: 0,
      totalServiceAmountCollected: 0,
    }
  }

  sendSuccess(res, {
    data: {
      commissionAmount: adminWallet.totalCommissionsCollected,
      platformFeesAmount: adminWallet.totalPlatformFeesCollected,
      serviceAmount: adminWallet.totalServiceAmountCollected,
    },
  })
})

export const processWithdrawalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status, adminRemarks } = req.body

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return sendError(res, { message: 'Status must be APPROVED or REJECTED', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const request = await WithdrawalRequest.findById(id).session(session)
    if (!request) {
      throw new Error('Withdrawal request not found')
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Request is already ${request.status}`)
    }

    if (request.vendorId) {
      // Vendor logic: Vendors don't have a strict Wallet document that gets deducted.
      // Their balance is dynamically calculated. We just update the status.
      request.status = status
      if (adminRemarks) request.adminRemarks = adminRemarks
      await request.save({ session })
      await session.commitTransaction()
      return sendSuccess(res, { message: `Vendor withdrawal request ${status.toLowerCase()} successfully`, data: { request } })
    }

    // Labour logic: Labours have a Wallet document
    const wallet = await Wallet.findOne({ userId: request.labourId }).session(session)
    if (!wallet) {
      throw new Error('Wallet not found for this user')
    }

    request.status = status
    if (adminRemarks) request.adminRemarks = adminRemarks

    if (status === 'REJECTED') {
      // Refund the held amount back to the labour's wallet
      wallet.selfBalance += request.amount
      await wallet.save({ session })
    } else if (status === 'APPROVED') {
      // Amount is already deducted, just create the transaction log
      await WalletTransaction.create([{
        walletId: wallet._id,
        amount: request.amount,
        type: 'DEBIT',
        targetWallet: 'BANK',
        context: 'WITHDRAWAL',
        description: `Withdrawal approved to bank. Remarks: ${adminRemarks || 'N/A'}`
      }], { session })
    }

    await request.save({ session })
    await session.commitTransaction()

    return sendSuccess(res, { message: `Withdrawal request ${status.toLowerCase()} successfully`, data: { request } })
  } catch (error) {
    await session.abortTransaction()
    return sendError(res, { message: error.message, statusCode: HTTP_STATUS.BAD_REQUEST })
  } finally {
    session.endSession()
  }
})

export const deleteWithdrawalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params
  const request = await WithdrawalRequest.findByIdAndDelete(id)
  if (!request) {
    return sendError(res, { message: 'Withdrawal request not found', statusCode: HTTP_STATUS.NOT_FOUND })
  }
  return sendSuccess(res, { message: 'Withdrawal request deleted successfully' })
})
