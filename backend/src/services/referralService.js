import crypto from 'crypto'
import { User } from '../models/User.js'
import { Referral, REFERRAL_STATUS } from '../models/Referral.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { creditEarnings } from './walletService.js'
import { USER_ROLES } from '../constants/roles.js'
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js'

/** No 0/O/1/I so codes are easy to read out loud or type from a screenshot */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const DEFAULT_REFERRAL_SETTINGS = {
  isEnabled: true,
  showInApp: true,
  referrerReward: 50,
  refereeReward: 25,
  rewardTrigger: 'FIRST_COMPLETED_JOB',
}

export function normalizeReferralCode(raw) {
  return String(raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function randomChars(n) {
  const bytes = crypto.randomBytes(n)
  let out = ''
  for (let i = 0; i < n; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  return out
}

/** e.g. "Rahul Sharma" → RAHU7K3MX; falls back to KE + random when the name has too few letters */
function buildCandidateCode(fullName) {
  const prefix = String(fullName || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
  return prefix.length >= 2 ? `${prefix}${randomChars(5)}` : `KE${randomChars(6)}`
}

/** Returns the user's referral code, assigning one if missing (covers accounts created before referrals existed). */
export async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = buildCandidateCode(user.fullName)
    try {
      const res = await User.updateOne({ _id: user._id, referralCode: null }, { $set: { referralCode: code } })
      if (res.modifiedCount === 1) {
        user.referralCode = code
        return code
      }
      // Another request assigned one first — use it
      const fresh = await User.findById(user._id).select('referralCode').lean()
      if (fresh?.referralCode) {
        user.referralCode = fresh.referralCode
        return fresh.referralCode
      }
    } catch (e) {
      if (e?.code !== 11000) throw e
    }
  }
  throw new Error('Could not generate a unique referral code')
}

export async function getReferralSettings() {
  const cfg = await SystemSetting.findOne({ configKey: 'master_config' }).select('referral').lean()
  return { ...DEFAULT_REFERRAL_SETTINGS, ...(cfg?.referral || {}) }
}

export async function findReferrerByCode(rawCode) {
  const code = normalizeReferralCode(rawCode)
  if (!code) return null
  return User.findOne({ referralCode: code, isActive: true, role: { $ne: USER_ROLES.ADMIN } })
}

async function creditReferralReward(userId, amount, referralId, description) {
  if (!(amount > 0)) return
  await creditEarnings({ userId, amount, context: 'REFERRAL', referenceId: referralId, description })
}

/**
 * Moves a PENDING referral to REWARDED and credits both wallets.
 * The status flip is atomic, so concurrent calls can never pay out twice.
 * @returns the updated referral, or null if it was not pending
 */
export async function rewardReferral(referralId, { settings, reviewedBy } = {}) {
  const cfg = settings || (await getReferralSettings())
  const referrerReward = Math.max(0, Number(cfg.referrerReward) || 0)
  const refereeReward = Math.max(0, Number(cfg.refereeReward) || 0)

  const referral = await Referral.findOneAndUpdate(
    { _id: referralId, status: REFERRAL_STATUS.PENDING },
    {
      $set: {
        status: REFERRAL_STATUS.REWARDED,
        rewardedAt: new Date(),
        referrerReward,
        refereeReward,
        ...(reviewedBy ? { reviewedBy } : {}),
      },
    },
    { new: true },
  )
  if (!referral) return null

  await creditReferralReward(referral.referrerId, referrerReward, referral._id, 'Referral reward — your friend joined KaamExpert')
  await creditReferralReward(referral.refereeId, refereeReward, referral._id, 'Welcome bonus — joined with a referral code')

  if (referrerReward > 0) {
    sendNotificationToUser(referral.referrerId, {
      title: 'Referral reward earned 🎉',
      body: `₹${referrerReward} has been added to your wallet.`,
      data: { type: 'referral_reward', referralId: String(referral._id) },
    }).catch(() => {})
  }
  if (refereeReward > 0) {
    sendNotificationToUser(referral.refereeId, {
      title: 'Welcome bonus unlocked',
      body: `₹${refereeReward} has been added to your wallet.`,
      data: { type: 'referral_reward', referralId: String(referral._id) },
    }).catch(() => {})
  }

  return referral
}

/**
 * Links a freshly registered user to the referrer behind `rawCode`.
 * Never throws for a bad/unknown code — signup must not fail because of referrals.
 */
export async function attachReferralOnSignup(referee, rawCode) {
  const code = normalizeReferralCode(rawCode)
  if (!code) return null
  const settings = await getReferralSettings()
  if (!settings.isEnabled) return null

  const referrer = await findReferrerByCode(code)
  if (!referrer || String(referrer._id) === String(referee._id)) return null

  await User.updateOne({ _id: referee._id }, { $set: { referredBy: referrer._id } })
  referee.referredBy = referrer._id

  let referral
  try {
    referral = await Referral.create({
      referrerId: referrer._id,
      refereeId: referee._id,
      code,
      referrerRole: referrer.role,
      refereeRole: referee.role,
    })
  } catch (e) {
    if (e?.code === 11000) return null
    throw e
  }

  if (settings.rewardTrigger === 'SIGNUP') {
    return (await rewardReferral(referral._id, { settings })) || referral
  }
  return referral
}

/**
 * Call when a user completes a booking or job. Rewards their pending referral (first completion only —
 * later calls find nothing pending). Pending rows from a SIGNUP-trigger period are also settled here.
 */
export async function qualifyReferral(userId) {
  if (!userId) return null
  const pending = await Referral.findOne({ refereeId: userId, status: REFERRAL_STATUS.PENDING }).select('_id').lean()
  if (!pending) return null
  const settings = await getReferralSettings()
  if (!settings.isEnabled) return null
  return rewardReferral(pending._id, { settings })
}

/** Fire-and-forget wrapper for completion hooks — referral errors must never break a booking update. */
export function qualifyReferralsInBackground(...userIds) {
  const unique = [...new Set(userIds.filter(Boolean).map(String))]
  for (const id of unique) {
    qualifyReferral(id).catch((err) => console.error('[referral] qualify failed:', err?.message || err))
  }
}

/** "Rahul Sharma" → "Rahul S." — enough for the referrer to recognise a friend without exposing full details */
export function shortDisplayName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'New user'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

/** Everything the app's Refer & Earn screen needs for one user */
export async function getReferralOverview(user) {
  const code = await ensureReferralCode(user)
  const settings = await getReferralSettings()

  const [rows, statusAgg, joinedWith] = await Promise.all([
    Referral.find({ referrerId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('refereeId', 'fullName role')
      .lean(),
    Referral.aggregate([
      { $match: { referrerId: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, earned: { $sum: '$referrerReward' } } },
    ]),
    user.referredBy
      ? Referral.findOne({ refereeId: user._id }).populate('referrerId', 'fullName').lean()
      : null,
  ])

  const stats = { total: 0, pending: 0, rewarded: 0, rejected: 0, totalEarned: 0 }
  for (const g of statusAgg) {
    stats.total += g.count
    if (g._id === REFERRAL_STATUS.PENDING) stats.pending = g.count
    if (g._id === REFERRAL_STATUS.REJECTED) stats.rejected = g.count
    if (g._id === REFERRAL_STATUS.REWARDED) {
      stats.rewarded = g.count
      stats.totalEarned = g.earned
    }
  }

  return {
    code,
    program: {
      isEnabled: settings.isEnabled,
      showInApp: settings.showInApp,
      referrerReward: settings.referrerReward,
      refereeReward: settings.refereeReward,
      rewardTrigger: settings.rewardTrigger,
    },
    stats,
    referrals: rows.map((r) => ({
      _id: r._id,
      name: shortDisplayName(r.refereeId?.fullName),
      role: r.refereeRole || r.refereeId?.role,
      status: r.status,
      reward: r.status === REFERRAL_STATUS.REWARDED ? r.referrerReward : 0,
      joinedAt: r.createdAt,
      rewardedAt: r.rewardedAt,
    })),
    joinedWith: joinedWith
      ? {
          referrerName: shortDisplayName(joinedWith.referrerId?.fullName),
          status: joinedWith.status,
          reward: joinedWith.status === REFERRAL_STATUS.REWARDED ? joinedWith.refereeReward : 0,
        }
      : null,
  }
}
