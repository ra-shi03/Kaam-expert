import { Bonus, BONUS_STATUS } from '../models/Bonus.js'
import { User } from '../models/User.js'
import { USER_ROLES } from '../constants/roles.js'
import { createBonus, getBonusSettings, reverseBonus } from '../services/bonusService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Filters shared by the list and its summary tiles (status excluded so the tiles show gross vs reversed) */
async function buildFilter(query) {
  const filter = {}
  if (query.bonusType) filter.bonusType = query.bonusType
  if (query.labourId) filter.labourId = query.labourId

  if (query.from || query.to) {
    filter.createdAt = {}
    if (query.from) filter.createdAt.$gte = new Date(query.from)
    if (query.to) {
      const to = new Date(query.to)
      // A bare date (YYYY-MM-DD) means "through the end of that day"
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.to)) to.setUTCHours(23, 59, 59, 999)
      filter.createdAt.$lte = to
    }
  }

  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 80) : ''
  if (search) {
    const or = [{ fullName: new RegExp(escapeRegex(search), 'i') }]
    const digits = search.replace(/\D/g, '')
    if (digits.length >= 2) or.push({ phone: { $regex: digits } })
    const labours = await User.find({ role: USER_ROLES.LABOUR, $or: or }).select('_id').limit(500).lean()
    filter.$or = [
      { bonusCode: new RegExp(escapeRegex(search), 'i') },
      { labourId: { $in: labours.map((u) => u._id) } },
    ]
  }
  return filter
}

/** GET /admin/bonuses */
export const listBonuses = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))

  if (req.query.from && req.query.to && new Date(req.query.from) > new Date(req.query.to)) {
    return sendError(res, { message: 'Start date must be before end date', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const baseFilter = await buildFilter(req.query)
  const listFilter = req.query.status ? { ...baseFilter, status: req.query.status } : baseFilter

  const [items, total, totals, settings] = await Promise.all([
    Bonus.find(listFilter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('labourId', 'fullName phone')
      .populate('createdBy', 'fullName email')
      .lean(),
    Bonus.countDocuments(listFilter),
    Bonus.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
    getBonusSettings(),
  ])

  const byStatus = Object.fromEntries(totals.map((t) => [t._id, t]))
  const credited = byStatus[BONUS_STATUS.CREDITED] || { count: 0, amount: 0 }
  const reversed = byStatus[BONUS_STATUS.REVERSED] || { count: 0, amount: 0 }

  return sendSuccess(res, {
    data: {
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        // Gross = everything ever awarded; net = what is still credited after reversals
        totalAwarded: credited.amount + reversed.amount,
        totalReversed: reversed.amount,
        netCredited: credited.amount,
        creditedCount: credited.count,
        reversedCount: reversed.count,
      },
      settings,
    },
  })
})

/** GET /admin/bonuses/:id */
export const getBonus = asyncHandler(async (req, res) => {
  const bonus = await Bonus.findById(req.params.id)
    .populate('labourId', 'fullName phone labourProfile.kycStatus')
    .populate('createdBy', 'fullName email')
    .populate('reversedBy', 'fullName email')
    .populate('walletTransactionId')
    .populate('reversalTransactionId')
    .lean()
  if (!bonus) {
    return sendError(res, { message: 'Bonus not found', statusCode: HTTP_STATUS.NOT_FOUND, code: 'BONUS_NOT_FOUND' })
  }
  return sendSuccess(res, { data: { bonus } })
})

/** POST /admin/bonuses — requires an Idempotency-Key header (one per award; reuse it when retrying) */
export const createBonusHandler = asyncHandler(async (req, res) => {
  const { labourId, amount, bonusType, reason, internalNote } = req.body
  const result = await createBonus({
    labourId,
    amount,
    bonusType,
    reason,
    internalNote,
    adminId: req.user._id,
    idempotencyKey: req.get('Idempotency-Key'),
  })
  return sendSuccess(res, {
    statusCode: result.duplicate ? HTTP_STATUS.OK : HTTP_STATUS.CREATED,
    message: result.duplicate ? 'Bonus was already credited for this request' : 'Bonus credited to the labour wallet',
    data: { bonus: result.bonus, duplicate: result.duplicate, walletSummary: result.walletSummary ?? null },
  })
})

/** PATCH /admin/bonuses/:id/reverse */
export const reverseBonusHandler = asyncHandler(async (req, res) => {
  const result = await reverseBonus({ bonusId: req.params.id, adminId: req.user._id, reason: req.body.reason })
  return sendSuccess(res, {
    message:
      result.uncovered > 0
        ? `Bonus reversed. ₹${result.uncovered} could not be covered by the wallet and was added as dues.`
        : 'Bonus reversed and deducted from the labour wallet',
    data: result,
  })
})
