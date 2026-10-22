import { Referral, REFERRAL_STATUS } from '../models/Referral.js'
import { User } from '../models/User.js'
import {
  findReferrerByCode,
  getReferralOverview,
  getReferralSettings,
  normalizeReferralCode,
  rewardReferral,
  shortDisplayName,
} from '../services/referralService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'

/** GET /referrals/me — own code, program terms, stats and the people you invited */
export const getMyReferrals = asyncHandler(async (req, res) => {
  const data = await getReferralOverview(req.user)
  return sendSuccess(res, { data })
})

/** GET /referrals/validate/:code — public; used by the /r/:code landing page and the signup form */
export const validateReferralCode = asyncHandler(async (req, res) => {
  const settings = await getReferralSettings()
  if (!settings.isEnabled) {
    return sendError(res, {
      message: 'The referral program is currently paused',
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: 'REFERRAL_DISABLED',
    })
  }
  const referrer = await findReferrerByCode(req.params.code)
  if (!referrer) {
    return sendError(res, {
      message: 'This referral code is not valid',
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: 'INVALID_REFERRAL_CODE',
    })
  }
  return sendSuccess(res, {
    data: {
      code: normalizeReferralCode(req.params.code),
      referrer: { name: shortDisplayName(referrer.fullName), role: referrer.role },
      refereeReward: settings.refereeReward,
      rewardTrigger: settings.rewardTrigger,
    },
  })
})

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** GET /admin/referrals?status=&search=&page=&limit= */
export const listAdminReferrals = asyncHandler(async (req, res) => {
  const { status, search } = req.query
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))

  const q = {}
  if (status && status !== 'all') {
    if (!Object.values(REFERRAL_STATUS).includes(status)) {
      return sendError(res, { message: 'Invalid status filter', statusCode: HTTP_STATUS.BAD_REQUEST })
    }
    q.status = status
  }

  const searchTrim = typeof search === 'string' ? search.trim().slice(0, 80) : ''
  if (searchTrim) {
    const userOr = [{ fullName: new RegExp(escapeRegex(searchTrim), 'i') }]
    const digits = searchTrim.replace(/\D/g, '')
    if (digits.length >= 2) userOr.push({ phone: { $regex: digits } })
    const userIds = await User.find({ $or: userOr }).select('_id').limit(500).lean()
    const ids = userIds.map((u) => u._id)
    q.$or = [
      { code: new RegExp(escapeRegex(normalizeReferralCode(searchTrim) || searchTrim), 'i') },
      { referrerId: { $in: ids } },
      { refereeId: { $in: ids } },
    ]
  }

  const [items, total, statusAgg] = await Promise.all([
    Referral.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('referrerId', 'fullName phone role referralCode')
      .populate('refereeId', 'fullName phone role')
      .lean(),
    Referral.countDocuments(q),
    Referral.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          paid: { $sum: { $add: ['$referrerReward', '$refereeReward'] } },
        },
      },
    ]),
  ])

  const stats = { total: 0, pending: 0, rewarded: 0, rejected: 0, totalPaidOut: 0 }
  for (const g of statusAgg) {
    stats.total += g.count
    if (g._id === REFERRAL_STATUS.PENDING) stats.pending = g.count
    if (g._id === REFERRAL_STATUS.REJECTED) stats.rejected = g.count
    if (g._id === REFERRAL_STATUS.REWARDED) {
      stats.rewarded = g.count
      stats.totalPaidOut = g.paid
    }
  }

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.max(1, Math.ceil(total / limit)), stats },
  })
})

/** PATCH /admin/referrals/:id/approve — pay out a pending referral now, at current reward amounts */
export const approveReferral = asyncHandler(async (req, res) => {
  const referral = await rewardReferral(req.params.id, { reviewedBy: req.user._id })
  if (!referral) {
    return sendError(res, {
      message: 'Referral not found or already processed',
      statusCode: HTTP_STATUS.CONFLICT,
      code: 'REFERRAL_NOT_PENDING',
    })
  }
  return sendSuccess(res, { message: 'Referral rewarded', data: { referral } })
})

/** PATCH /admin/referrals/:id/reject — block a suspicious referral before it pays out */
export const rejectReferral = asyncHandler(async (req, res) => {
  const referral = await Referral.findOneAndUpdate(
    { _id: req.params.id, status: REFERRAL_STATUS.PENDING },
    {
      $set: {
        status: REFERRAL_STATUS.REJECTED,
        rejectedReason: req.body.reason || undefined,
        reviewedBy: req.user._id,
      },
    },
    { new: true },
  )
  if (!referral) {
    return sendError(res, {
      message: 'Referral not found or already processed',
      statusCode: HTTP_STATUS.CONFLICT,
      code: 'REFERRAL_NOT_PENDING',
    })
  }
  return sendSuccess(res, { message: 'Referral rejected', data: { referral } })
})
