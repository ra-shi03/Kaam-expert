import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { WithdrawalRequest } from '../models/WithdrawalRequest.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import { Bonus } from '../models/Bonus.js'
import { getCashWalletSettings, listWalletTransactions, summarizeWallet } from '../services/walletService.js'
import mongoose from 'mongoose'

export const getMyWallet = asyncHandler(async (req, res) => {
  await Wallet.updateOne({ userId: req.user._id }, { $setOnInsert: { userId: req.user._id } }, { upsert: true })
  return sendSuccess(res, { data: await buildWalletView(req.user._id) })
})

function calculateLabourBookingShare(b, userId) {
  let share = b.laborShare || b.basePrice || 0

  if (b.assignments && b.assignments.length > 0) {
    if (b.contractorInfo?.services?.length > 0) {
      let subTotal = 0
      b.contractorInfo.services.forEach(s => {
        subTotal += (s.price || 0) * (b.hours || 1) * (s.quantity || 1)
      })
      const ratio = subTotal > 0 ? (b.laborShare || 0) / subTotal : 0

      let availableServices = []
      b.contractorInfo.services.forEach(s => {
        const sShare = (s.price || 0) * (b.hours || 1) * ratio
        for (let i = 0; i < (s.quantity || 1); i++) {
          availableServices.push({ serviceId: String(s.serviceId?._id || s.serviceId), share: sShare, assigned: false })
        }
      })

      b.assignments.forEach(a => {
        const labour = a.labourId
        if (!labour) return
        const labServiceIds = [
          ...(labour.serviceIds || []),
          ...(labour.labourProfile?.serviceIds || [])
        ].map(id => String(id))
        let matchedService = availableServices.find(as => !as.assigned && labServiceIds.includes(as.serviceId))
        if (!matchedService) matchedService = availableServices.find(as => !as.assigned)
        if (matchedService) {
          matchedService.assigned = true
          matchedService.labourIdStr = String(labour._id || labour)
        }
      })

      const myService = availableServices.find(as => as.labourIdStr === String(userId))
      if (myService) {
        share = myService.share
      } else {
        share = b.laborShare / b.assignments.length
      }
    } else {
      const mainLabId = typeof b.laborId === 'object' ? b.laborId?._id : b.laborId
      if (String(mainLabId) !== String(userId) && !b.acceptedLabourIds?.some(id => String(id) === String(userId))) {
        share = 0
      }
    }
  } else {
    const mainLabId = typeof b.laborId === 'object' ? b.laborId?._id : b.laborId
    if (String(mainLabId) !== String(userId) && !b.acceptedLabourIds?.some(id => String(id) === String(userId))) {
      share = 0
    }
  }

  return share
}

export const getEarningsSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // 1. Calculate Earnings from Bookings (Direct + Contractor/Bulk)
  const now = new Date()
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const BookingsModel = mongoose.model('Booking')
  const completedBookings = await BookingsModel.find({
    $or: [
      { laborId: userId },
      { 'assignments.labourId': userId },
      { acceptedLabourIds: userId }
    ],
    status: { $in: ['COMPLETED', 'ACCEPTED', 'ASSIGNED', 'STARTED'] }
  })
    .populate('assignments.labourId', 'serviceIds labourProfile')
    .populate('contractorInfo.services.serviceId')

  let earnedPaise = 0
  let todayPaise = 0
  let weekPaise = 0
  let monthPaise = 0

  // Non-work credits are tracked separately (do NOT include in work earnings)
  const wallet = await Wallet.findOne({ userId })
  const ledgerTotals = await sumLedgerByContext(wallet?._id)
  const refundsPaise = Math.round((ledgerTotals.REFUND || 0) * 100)
  const referralPaise = Math.round((ledgerTotals.REFERRAL || 0) * 100)
  const bonusPaise = Math.round(((ledgerTotals.BONUS || 0) - (ledgerTotals.BONUS_REVERSAL || 0)) * 100)

  completedBookings.forEach(b => {
    const share = calculateLabourBookingShare(b, userId)
    if (share > 0 && b.paymentMethod !== 'CASH') {
      const sharePaise = Math.round(share * 100)
      earnedPaise += sharePaise

      const bookingDate = new Date(b.scheduledAt || b.createdAt)
      const bDateStr = new Date(bookingDate.getTime() - bookingDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]

      if (bDateStr === todayStr) {
        todayPaise += sharePaise
      }
      if (bookingDate >= weekAgo) {
        weekPaise += sharePaise
      }
      if (bookingDate >= monthStart) {
        monthPaise += sharePaise
      }
    }
  })

  // 2. Calculate Pending / Paid Withdrawals
  const userObjId = new mongoose.Types.ObjectId(String(userId))
  const pendingRequests = await WithdrawalRequest.aggregate([
    {
      $match: {
        $or: [{ labourId: userObjId }, { userId: userObjId }, { vendorId: userObjId }],
        status: 'PENDING'
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  const pendingInr = pendingRequests.length > 0 ? pendingRequests[0].total : 0

  const paidRequests = await WithdrawalRequest.aggregate([
    {
      $match: {
        $or: [{ labourId: userObjId }, { userId: userObjId }, { vendorId: userObjId }],
        status: 'APPROVED'
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  const paidInr = paidRequests.length > 0 ? paidRequests[0].total : 0

  // The wallet ledger is the source of truth for what can be withdrawn: pending requests are already
  // held out of selfBalance, and cash-job dues are recovered from earnings before anything is withdrawable.
  const walletSummary = summarizeWallet(wallet)
  const availablePaise = walletSummary.withdrawable * 100
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
        withdrawnPaise: paidInr * 100,
        refundsPaise,
        referralPaise,
        bonusPaise,
        walletBalancePaise: Math.round(walletSummary.balance * 100),
        rechargePaise: Math.round(walletSummary.rechargeBalance * 100),
        duesPaise: Math.round(walletSummary.outstandingDues * 100),
      }
    }
  })
})

/** Sum of ledger amounts per context for one wallet (credits minus debits within each context) */
async function sumLedgerByContext(walletId) {
  if (!walletId) return {}
  const rows = await WalletTransaction.aggregate([
    { $match: { walletId } },
    {
      $group: {
        _id: '$context',
        total: { $sum: { $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', { $multiply: ['$amount', -1] }] } },
      },
    },
  ])
  return Object.fromEntries(rows.map((r) => [r._id, Math.abs(r.total)]))
}

async function buildWalletView(userId) {
  const [wallet, settings] = await Promise.all([Wallet.findOne({ userId }).lean(), getCashWalletSettings()])
  const summary = summarizeWallet(wallet)
  const blockedByDues = summary.outstandingDues > 0 && summary.outstandingDues >= settings.labourCashLimit
  return {
    wallet: wallet || { userId, selfBalance: 0, rechargeBalance: 0, adminBalance: 0 },
    summary,
    cashWallet: {
      isEnabled: settings.isEnabled,
      minBalance: settings.minBalance,
      minRecharge: settings.minRecharge,
      maxRecharge: settings.maxRecharge,
      // Cash jobs stay open while outstanding dues are under the admin limit (a controlled negative balance)
      canTakeCashJobs: !blockedByDues,
      blockedByDues,
      /** Dues are at 70%+ of the limit — warn before jobs get paused */
      nearDuesLimit: !blockedByDues && summary.outstandingDues > 0 && summary.outstandingDues >= settings.labourCashLimit * 0.7,
      labourCashLimit: settings.labourCashLimit,
    },
  }
}

/** GET /wallets/transactions — the labourer's own wallet statement */
export const getMyTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))
  const data = await listWalletTransactions(req.user._id, { page, limit })
  return sendSuccess(res, { data })
})

/** GET /wallets/bonuses — the labourer's own bonuses (no admin-only fields) */
export const getMyBonuses = asyncHandler(async (req, res) => {
  const bonuses = await Bonus.find({ labourId: req.user._id })
    .select('bonusCode amount bonusType reason status createdAt reversedAt reversalReason')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
  return sendSuccess(res, { data: { bonuses } })
})

/**
 * POST /wallets/clear — retired. It reduced dues without any payment; dues are now cleared only by a
 * paid wallet recharge (POST /payments/init with purpose WALLET_RECHARGE), which settles dues first.
 */
export const clearAdminDues = asyncHandler(async (req, res) => {
  return sendError(res, {
    message: 'Dues are cleared by recharging your wallet. Open Wallet → Recharge.',
    statusCode: 410,
    code: 'USE_WALLET_RECHARGE',
  })
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

    // Only earnings are withdrawable, after any cash-job dues are recovered (see walletService)
    const { withdrawable } = summarizeWallet(wallet)
    if (numAmount > withdrawable) {
      throw new Error(`You can withdraw up to ₹${withdrawable} right now`)
    }

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
