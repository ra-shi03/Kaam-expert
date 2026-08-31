import { SubscriptionPlan } from '../models/SubscriptionPlan.js'
import { UserSubscription } from '../models/UserSubscription.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'

/**
 * GET /admin/labour-subscriptions
 * List all labour daily subscriptions with filters
 */
export const getLabourSubscriptions = asyncHandler(async (req, res) => {
  const {
    date,
    status,
    refundStatus,
    search,
    page = 1,
    limit = 30,
  } = req.query

  const query = { labour: { $exists: true } }

  // Date filter
  if (date) {
    query.date = { $lte: date }
    query.endDate = { $gte: date }
  }

  if (status && status !== 'all') {
    query.status = status
  }

  if (refundStatus && refundStatus !== 'all') {
    query.refundStatus = refundStatus
  }

  const skip = (Number(page) - 1) * Number(limit)

  let subscriptions = await UserSubscription.find(query)
    .populate({
      path: 'labour',
      select: 'fullName phone email city labourProfile.kycStatus',
    })
    .populate({ path: 'adminActionBy', select: 'fullName email' })
    .populate('planId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  // Apply search filter on populated fields and dynamic expiration
  if (search) {
    const s = search.toLowerCase()
    subscriptions = subscriptions.filter((sub) => {
      const name = sub.labour?.fullName?.toLowerCase() || ''
      const phone = sub.labour?.phone || ''
      return name.includes(s) || phone.includes(s)
    })
  }

  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const endHour = settings?.subscriptionEndHour ?? 20
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const currentHour = nowIST.getHours()

  subscriptions = subscriptions.map(sub => {
    if (sub.status === 'active' && sub.endDate < todayStr) {
      sub.status = 'expired'
    }

    if (!sub.refundEligibility && sub.durationDays === 1 && (sub.bookingsReceived || 0) === 0 && (sub.bookingOpportunitiesOffered || 0) === 0) {
      if (sub.date < todayStr || (sub.date === todayStr && currentHour >= endHour)) {
        sub.refundEligibility = true
      }
    }
    
    return sub
  })

  const total = await UserSubscription.countDocuments(query)

  return sendSuccess(res, {
    data: { subscriptions, total, page: Number(page), limit: Number(limit), date },
  })
})

/**
 * GET /admin/labour-subscriptions/refund-eligible
 * Get all subscriptions eligible for refund (bookingsReceived = 0 after window ends)
 */
export const getRefundEligible = asyncHandler(async (req, res) => {
  const { date } = req.query

  const settings = await SystemSetting.findOne({ configKey: 'master_config' })
  const endHour = settings?.subscriptionEndHour ?? 20
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const currentHour = nowIST.getHours()
  const todayStr = nowIST.toISOString().split('T')[0]

  // We want subscriptions that are either explicitly marked as refundEligible=true,
  // OR missed by cron but logically eligible (1-day plan, 0 bookings, window ended).
  // Window ended means either date < today, or (date == today AND currentHour >= endHour).
  
  const baseQuery = {
    labour: { $exists: true },
    refundStatus: { $in: ['pending', 'processing', 'failed'] },
  }

  if (date) {
    baseQuery.date = { $lte: date }
    baseQuery.endDate = { $gte: date }
  }

  const allPending = await UserSubscription.find(baseQuery)
    .populate({ path: 'labour', select: 'fullName phone email city' })
    .populate('planId', 'name')
    .sort({ createdAt: -1 })
    .lean()

  const subscriptions = allPending.filter(sub => {
    // If explicitly marked eligible, include it
    if (sub.refundEligibility) return true

    // If not explicitly marked, check if it SHOULD be eligible (missed by cron)
    if (sub.durationDays === 1 && (sub.bookingsReceived || 0) === 0 && (sub.bookingOpportunitiesOffered || 0) === 0) {
      if (sub.date < todayStr) return true
      if (sub.date === todayStr && currentHour >= endHour) return true
    }
    return false
  })

  // Ensure they have refundEligibility=true in the response so frontend logic works
  const mappedSubscriptions = subscriptions.map(sub => {
    sub.refundEligibility = true
    return sub
  })

  return sendSuccess(res, {
    data: { subscriptions: mappedSubscriptions, count: mappedSubscriptions.length, date: date || null },
  })
})

/**
 * GET /admin/labour-subscriptions/stats
 * Get daily subscription stats for admin dashboard
 */
export const getSubscriptionStats = asyncHandler(async (req, res) => {
  const { date } = req.query
  
  const baseQuery = { labour: { $exists: true } }
  let targetDate = null

  if (date) {
    targetDate = date
    baseQuery.date = { $lte: targetDate }
    baseQuery.endDate = { $gte: targetDate }
  } else {
    // If no date selected, show active right now for 'active' stats
    const today = new Date().toISOString().split('T')[0]
    baseQuery.date = { $lte: today }
    baseQuery.endDate = { $gte: today }
  }

  // To count "Total" and "Refunded" over all time when no date is selected, we need separate queries
  const allTimeQuery = { labour: { $exists: true } }
  if (date) {
    allTimeQuery.date = { $lte: targetDate }
    allTimeQuery.endDate = { $gte: targetDate }
  }

  const [
    totalCount,
    activeCount,
    refundedCount,
    pendingRefund,
    rejectedRefund,
  ] = await Promise.all([
    UserSubscription.countDocuments(allTimeQuery),
    UserSubscription.countDocuments({ ...baseQuery, status: 'active' }),
    UserSubscription.countDocuments({ ...allTimeQuery, status: 'refunded' }),
    UserSubscription.countDocuments({
      ...allTimeQuery,
      refundEligibility: true,
      refundStatus: { $in: ['pending', 'processing'] },
    }),
    UserSubscription.countDocuments({ ...allTimeQuery, refundStatus: 'manually_rejected' }),
  ])

  // Revenue aggregation
  const matchStage = { labour: { $exists: true } }
  if (date) {
    matchStage.date = targetDate
  }

  const revenueAgg = await UserSubscription.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amountPaid' },
        totalRefunded: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$refundAmount', 0] },
        },
      },
    },
  ])

  const rev = revenueAgg[0] || { totalRevenue: 0, totalRefunded: 0 }

  // Last 7 days trend
  const last7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const count = await UserSubscription.countDocuments({ date: { $lte: dayStr }, endDate: { $gte: dayStr }, status: 'active' })
    last7.push({ date: dayStr, count })
  }

  return sendSuccess(res, {
    data: {
      date: targetDate,
      totalToday: totalCount,
      activeToday: activeCount,
      refundedToday: refundedCount,
      pendingRefund,
      rejectedRefund,
      totalRevenue: rev.totalRevenue,
      totalRefunded: rev.totalRefunded,
      netRevenue: rev.totalRevenue - rev.totalRefunded,
      last7Days: last7,
    },
  })
})

/**
 * GET /admin/labour-subscriptions/:id
 * Get a single subscription detail
 */
export const getSubscriptionById = asyncHandler(async (req, res) => {
  const sub = await UserSubscription.findById(req.params.id)
    .populate({ path: 'labour', select: 'fullName phone email city labourProfile' })
    .populate({ path: 'adminActionBy', select: 'fullName email' })
    .lean()

  if (!sub) {
    return sendError(res, { message: 'Subscription not found', statusCode: HTTP_STATUS.NOT_FOUND })
  }
  return sendSuccess(res, { data: { subscription: sub } })
})

/**
 * PATCH /admin/labour-subscriptions/:id/refund
 * Admin approve / reject / process refund manually
 * Body: { action: 'approve' | 'reject' | 'process', note?: string }
 */
export const processAdminRefund = asyncHandler(async (req, res) => {
  const { action, note } = req.body
  const adminId = req.user._id

  if (!['approve', 'reject', 'process'].includes(action)) {
    return sendError(res, {
      message: 'action must be approve, reject, or process',
      statusCode: HTTP_STATUS.BAD_REQUEST,
    })
  }

  const sub = await UserSubscription.findById(req.params.id).populate('labour')
  if (!sub) {
    return sendError(res, { message: 'Subscription not found', statusCode: HTTP_STATUS.NOT_FOUND })
  }

  if (action === 'reject') {
    sub.refundStatus = 'manually_rejected'
    sub.adminActionBy = adminId
    sub.adminActionNote = note || 'Rejected by admin'
    sub.refundProcessedAt = new Date()
    await sub.save()
    return sendSuccess(res, { message: 'Refund rejected', data: { subscription: sub } })
  }

  if (action === 'approve') {
    // Mark as manually approved — to be processed separately
    sub.refundStatus = 'manually_approved'
    sub.refundEligibility = true
    sub.refundAmount = sub.amountPaid
    sub.adminActionBy = adminId
    sub.adminActionNote = note || 'Approved by admin'
    await sub.save()
    return sendSuccess(res, { message: 'Refund approved — awaiting processing', data: { subscription: sub } })
  }

  if (action === 'process') {
    if (sub.status === 'refunded' || sub.refundStatus === 'refunded') {
      return sendError(res, {
        message: 'This subscription has already been refunded.',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      })
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const currentHour = nowIST.getHours()
    const settings = await SystemSetting.findOne({ configKey: 'master_config' })
    const endHour = settings?.subscriptionEndHour ?? 20

    // Check dynamic eligibility (1-day plan with 0 bookings after window ends or past date)
    const isLogicallyEligible =
      sub.refundEligibility ||
      sub.refundStatus === 'manually_approved' ||
      (sub.durationDays === 1 &&
        (sub.bookingsReceived || 0) === 0 &&
        (sub.bookingOpportunitiesOffered || 0) === 0 &&
        (sub.date < todayStr || (sub.date === todayStr && currentHour >= endHour)))

    const canProcess =
      isLogicallyEligible ||
      ['pending', 'processing', 'manually_approved', 'failed'].includes(sub.refundStatus) ||
      sub.durationDays === 1

    if (!canProcess) {
      return sendError(res, {
        message: 'Subscription is not eligible for refund processing',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      })
    }

    sub.refundEligibility = true
    sub.refundStatus = 'processing'
    sub.refundAttemptCount = (sub.refundAttemptCount || 0) + 1
    await sub.save()

    // Process actual refund to Labour wallet
    let wallet = await Wallet.findOne({ userId: sub.labour._id })
    if (!wallet) {
      wallet = await Wallet.create({ userId: sub.labour._id, selfBalance: 0 })
    }

    const refundAmt = sub.refundAmount || sub.amountPaid
    wallet.selfBalance = (wallet.selfBalance || 0) + refundAmt
    await wallet.save()

    await WalletTransaction.create({
      walletId: wallet._id,
      type: 'CREDIT',
      targetWallet: 'SELF',
      context: 'REFUND',
      amount: refundAmt,
      description: `Daily subscription refund (${sub.date}) - Admin processed`,
      referenceId: sub._id,
    })

    sub.status = 'refunded'
    sub.refundStatus = 'refunded'
    sub.refundTimestamp = new Date()
    sub.refundProcessedAt = new Date()
    sub.refundTransactionId = `ADM-${Date.now()}`
    sub.adminActionBy = adminId
    sub.adminActionNote = note || 'Processed by admin'
    await sub.save()

    return sendSuccess(res, {
      message: `Refund of ₹${refundAmt} credited to labour wallet`,
      data: { subscription: sub },
    })
  }
})

/**
 * GET /admin/labour-subscriptions/history
 * Get refund history with pagination
 */
export const getRefundHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, date } = req.query
  const query = {
    labour: { $exists: true },
    refundStatus: { $in: ['refunded', 'manually_rejected', 'manually_approved'] },
  }
  if (date) {
    query.date = { $lte: date }
    query.endDate = { $gte: date }
  }

  const skip = (Number(page) - 1) * Number(limit)
  const [subscriptions, total] = await Promise.all([
    UserSubscription.find(query)
      .populate({ path: 'labour', select: 'fullName phone email city' })
      .populate({ path: 'adminActionBy', select: 'fullName email' })
      .populate('planId', 'name')
      .sort({ refundProcessedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    UserSubscription.countDocuments(query),
  ])

  return sendSuccess(res, {
    data: { subscriptions, total, page: Number(page), limit: Number(limit) },
  })
})

export const getSubscriptionPlans = asyncHandler(async (req, res) => {
  let plans = await SubscriptionPlan.find().sort({ durationDays: 1 }).lean()
  
  if (plans.length === 0) {
    const defaultPlans = [
      { name: '1 Week', durationDays: 7, price: 99, features: ['Access to all daily jobs', 'Priority support'] },
      { name: '15 Days', durationDays: 15, price: 199, features: ['Access to all daily jobs', 'Priority support', 'Featured profile'] },
      { name: '1 Month', durationDays: 30, price: 299, features: ['Access to all daily jobs', 'Priority support', 'Featured profile', 'Zero commission on first 5 jobs'] }
    ]
    await SubscriptionPlan.insertMany(defaultPlans)
    plans = await SubscriptionPlan.find().sort({ durationDays: 1 }).lean()
  }

  return sendSuccess(res, { data: { plans } })
})

export const createSubscriptionPlan = asyncHandler(async (req, res) => {
  const { name, durationDays, price, features, isActive } = req.body
  const plan = await SubscriptionPlan.create({ name, durationDays, price, features, isActive })
  return sendSuccess(res, { message: 'Plan created successfully', data: { plan } })
})

export const updateSubscriptionPlan = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { name, durationDays, price, features, isActive } = req.body
  const plan = await SubscriptionPlan.findByIdAndUpdate(
    id,
    { name, durationDays, price, features, isActive },
    { new: true, runValidators: true }
  )
  if (!plan) return sendError(res, { message: 'Plan not found', statusCode: HTTP_STATUS.NOT_FOUND })
  return sendSuccess(res, { message: 'Plan updated successfully', data: { plan } })
})

export const deleteSubscriptionPlan = asyncHandler(async (req, res) => {
  const { id } = req.params
  const plan = await SubscriptionPlan.findByIdAndDelete(id)
  if (!plan) return sendError(res, { message: 'Plan not found', statusCode: HTTP_STATUS.NOT_FOUND })
  return sendSuccess(res, { message: 'Plan deleted successfully' })
})
