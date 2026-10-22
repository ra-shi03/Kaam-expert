import mongoose from 'mongoose'
import { Wallet } from '../models/Wallet.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { Booking } from '../models/Booking.js'
import { AdminWallet } from '../models/AdminWallet.js'

/**
 * Labour wallet (Rapido-style). One balance made of three buckets:
 *   selfBalance     — withdrawable earnings (online payouts, refunds, referral, bonus)
 *   rechargeBalance — prepaid top-ups; spent on platform fees for cash jobs, never withdrawn
 *   adminBalance    — dues: platform fees the buckets above could not cover
 * Net balance = earnings + recharge − dues (negative ⇒ labourer owes the platform).
 *
 * Rules: credits clear dues first; cash-job fees drain recharge, then earnings, and only the
 * uncovered rest becomes dues. Every change writes a WalletTransaction in the same DB transaction.
 */

export const DEFAULT_CASH_WALLET_SETTINGS = {
  isEnabled: true,
  minBalance: 0,
  minRecharge: 100,
  maxRecharge: 10000,
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

export class WalletError extends Error {
  constructor(message, { statusCode = 400, code = 'WALLET_ERROR' } = {}) {
    super(message)
    this.name = 'WalletError'
    this.statusCode = statusCode
    this.code = code
  }
}

/** Display-ready numbers. Safe on legacy wallets whose buckets were never netted against each other. */
export function summarizeWallet(wallet) {
  const earnings = round2(wallet?.selfBalance)
  const recharge = round2(wallet?.rechargeBalance)
  const dues = round2(wallet?.adminBalance)
  const balance = round2(earnings + recharge - dues)
  return {
    balance,
    earningsBalance: earnings,
    rechargeBalance: recharge,
    dues,
    /** Only earnings can be withdrawn, and never more than the net balance (dues are recovered first) */
    withdrawable: Math.max(0, Math.floor(Math.min(earnings, balance))),
    outstandingDues: Math.max(0, round2(-balance)),
  }
}

/** Folds negative buckets into dues, then nets dues against recharge and earnings. Net balance is unchanged. */
function normalize({ self, recharge, dues }) {
  let s = round2(self)
  let r = round2(recharge)
  let d = Math.max(0, round2(dues))
  if (s < 0) { d += -s; s = 0 }
  if (r < 0) { d += -r; r = 0 }
  const fromRecharge = Math.min(r, d)
  r -= fromRecharge
  d -= fromRecharge
  const fromEarnings = Math.min(s, d)
  s -= fromEarnings
  d -= fromEarnings
  return { self: round2(s), recharge: round2(r), dues: round2(d) }
}

function planCredit(buckets, amount, bucket) {
  const n = normalize(buckets)
  const toDues = Math.min(n.dues, amount)
  return { next: { ...n, dues: round2(n.dues - toDues), [bucket]: round2(n[bucket] + amount - toDues) } }
}

function planDebit(buckets, amount, order) {
  const next = normalize(buckets)
  let remaining = round2(amount)
  for (const bucket of order) {
    const take = Math.min(next[bucket], remaining)
    next[bucket] = round2(next[bucket] - take)
    remaining = round2(remaining - take)
  }
  next.dues = round2(next.dues + remaining)
  return { next, uncovered: remaining }
}

/** Runs `fn(session)` in a MongoDB transaction (retried automatically on transient write conflicts). */
export async function runInTransaction(fn) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } finally {
    await session.endSession()
  }
}

const withSession = (session, fn) => (session ? fn(session) : runInTransaction(fn))

async function mutateWallet({ userId, session, plan, ledger }) {
  await Wallet.updateOne({ userId }, { $setOnInsert: { userId } }, { upsert: true, session })
  const wallet = await Wallet.findOne({ userId }).session(session)
  const before = { self: wallet.selfBalance || 0, recharge: wallet.rechargeBalance || 0, dues: wallet.adminBalance || 0 }
  const { next, uncovered = 0 } = plan(before)

  wallet.selfBalance = next.self
  wallet.rechargeBalance = next.recharge
  wallet.adminBalance = next.dues
  await wallet.save({ session })

  const [transaction] = await WalletTransaction.create(
    [{ walletId: wallet._id, balanceAfter: round2(next.self + next.recharge - next.dues), ...ledger }],
    { session },
  )

  // Dues just reached zero → cash bookings that were waiting on this labourer's fee are now settled
  if (before.dues > 0 && next.dues === 0) {
    await Booking.updateMany(
      {
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        adminSettlementStatus: 'PENDING',
        $or: [{ laborId: userId }, { 'assignments.labourId': userId }],
      },
      { $set: { adminSettlementStatus: 'SETTLED' } },
      { session },
    )
  }

  return { wallet, transaction, uncovered, summary: summarizeWallet(wallet) }
}

function assertAmount(amount) {
  if (!(Number(amount) > 0)) throw new WalletError('Amount must be greater than zero', { code: 'INVALID_AMOUNT' })
  return round2(amount)
}

/** Withdrawable credit (payout, bonus, referral, refund). Clears dues first. */
export async function creditEarnings({ userId, amount, context, referenceId, description, session }) {
  const value = assertAmount(amount)
  return withSession(session, (s) =>
    mutateWallet({
      userId,
      session: s,
      plan: (b) => planCredit(b, value, 'self'),
      ledger: { amount: value, type: 'CREDIT', targetWallet: 'SELF', context, referenceId, description },
    }),
  )
}

/** Prepaid top-up. Clears dues first; the rest is kept for future cash-job fees. */
export async function rechargeWallet({ userId, amount, referenceId, session }) {
  const value = assertAmount(amount)
  return withSession(session, (s) =>
    mutateWallet({
      userId,
      session: s,
      plan: (b) => planCredit(b, value, 'recharge'),
      ledger: {
        amount: value,
        type: 'CREDIT',
        targetWallet: 'SELF',
        context: 'RECHARGE',
        referenceId,
        description: 'Wallet recharge',
      },
    }),
  )
}

/** Debit that may exceed the balance — whatever the buckets in `order` can't cover becomes dues. */
export async function debitWallet({ userId, amount, context, referenceId, description, order = ['recharge', 'self'], session }) {
  const value = assertAmount(amount)
  return withSession(session, (s) =>
    mutateWallet({
      userId,
      session: s,
      plan: (b) => planDebit(b, value, order),
      ledger: { amount: value, type: 'DEBIT', targetWallet: 'SELF', context, referenceId, description },
    }),
  )
}

export async function getCashWalletSettings() {
  const cfg = await SystemSetting.findOne({ configKey: 'master_config' }).select('cashWallet labourCashLimit').lean()
  return {
    ...DEFAULT_CASH_WALLET_SETTINGS,
    ...(cfg?.cashWallet || {}),
    labourCashLimit: cfg?.labourCashLimit ?? 500,
  }
}

/** Platform's cut of a booking — what the labourer keeps aside from the cash they collect */
export function cashCutForBooking(booking) {
  return round2((booking.platformFee || 0) + (booking.taxes || 0) + (booking.commissionAmount || 0))
}

/** Expected fee for one labourer on a (possibly multi-worker) booking — used before assignments exist */
export function perLabourCashCut(booking) {
  const workers = Math.max(1, booking.quantity || 1)
  return Math.ceil((cashCutForBooking(booking) / workers) * 100) / 100
}

/** Splits the booking's platform cut evenly across the labourers who worked it */
export function splitCashCut(booking) {
  const total = cashCutForBooking(booking)
  const ids = [
    ...new Set((booking.assignments || []).map((a) => String(a.labourId?._id || a.labourId || '')).filter(Boolean)),
  ]
  if (!ids.length && booking.laborId) ids.push(String(booking.laborId))
  if (!ids.length || total <= 0) return []
  const each = Math.floor((total / ids.length) * 100) / 100
  return ids.map((labourId, i) => ({
    labourId,
    amount: i === ids.length - 1 ? round2(total - each * (ids.length - 1)) : each,
  }))
}

/** Can this labourer take a cash job whose fee is `fee`? */
export async function checkCashJobEligibility(userId, fee, settings) {
  const cfg = settings || (await getCashWalletSettings())
  const wallet = await Wallet.findOne({ userId }).lean()
  const { balance } = summarizeWallet(wallet)
  const required = round2(fee + (cfg.minBalance || 0))
  const allowed = balance >= required
  return { allowed, balance, required, fee: round2(fee), shortfall: allowed ? 0 : Math.ceil(required - balance) }
}

/**
 * Customer confirmed they paid cash: mark the booking PAID and deduct the platform fee from the
 * labourer wallet(s) — all in one transaction, so a double tap can never charge twice.
 * @returns null if the booking was already paid (or is not an unpaid completed cash booking)
 */
export async function settleCashBooking(bookingId) {
  return runInTransaction(async (session) => {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'COMPLETED', paymentMethod: 'CASH', paymentStatus: { $ne: 'PAID' } },
      { $set: { paymentStatus: 'PAID' } },
      { new: true, session },
    )
    if (!booking) return null

    const jobRef = String(booking._id).slice(-6).toUpperCase()
    const charges = []
    for (const share of splitCashCut(booking)) {
      const { uncovered, summary } = await debitWallet({
        userId: share.labourId,
        amount: share.amount,
        context: 'CASH_COMMISSION',
        referenceId: booking._id,
        description: `Platform fee for cash job #${jobRef}`,
        order: ['recharge', 'self'],
        session,
      })
      charges.push({ labourId: share.labourId, amount: share.amount, uncovered, balance: summary.balance })
    }

    booking.adminSettlementStatus = charges.every((c) => c.uncovered === 0) ? 'SETTLED' : 'PENDING'
    await booking.save({ session })

    if (booking.platformFee > 0 || booking.commissionAmount > 0 || booking.basePrice > 0 || booking.taxes > 0) {
      await AdminWallet.findOneAndUpdate(
        {},
        {
          $inc: {
            totalPlatformFeesCollected: booking.platformFee || 0,
            totalCommissionsCollected: booking.commissionAmount || 0,
            totalTaxesCollected: booking.taxes || 0,
            totalServiceAmountCollected: booking.basePrice || 0,
          },
        },
        { upsert: true, session },
      )
    }

    return { booking, charges }
  })
}

export async function listWalletTransactions(userId, { page = 1, limit = 20 } = {}) {
  const wallet = await Wallet.findOne({ userId }).select('_id').lean()
  if (!wallet) return { items: [], total: 0, page, pages: 1 }
  const [items, total] = await Promise.all([
    WalletTransaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WalletTransaction.countDocuments({ walletId: wallet._id }),
  ])
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) }
}
