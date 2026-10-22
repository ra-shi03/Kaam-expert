import crypto from 'crypto'
import mongoose from 'mongoose'
import { Bonus, BONUS_STATUS, BONUS_TYPES } from '../models/Bonus.js'
import { User } from '../models/User.js'
import { SystemSetting } from '../models/SystemSetting.js'
import { USER_ROLES } from '../constants/roles.js'
import { creditEarnings, debitWallet, runInTransaction, WalletError } from './walletService.js'
import { sendNotificationToUser } from '../utils/pushNotificationHelper.js'

export const DEFAULT_BONUS_SETTINGS = { maxAmount: 10000 }

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function newBonusCode() {
  const bytes = crypto.randomBytes(8)
  let out = ''
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  return `BON-${out}`
}

export async function getBonusSettings() {
  const cfg = await SystemSetting.findOne({ configKey: 'master_config' }).select('bonus').lean()
  return { ...DEFAULT_BONUS_SETTINGS, ...(cfg?.bonus || {}) }
}

function sameRequest(existing, input) {
  return (
    String(existing.labourId) === input.labourId &&
    existing.amount === input.amount &&
    existing.bonusType === input.bonusType &&
    existing.reason === input.reason
  )
}

/**
 * Award a bonus: creates the Bonus record, credits the labourer's withdrawable earnings and writes the
 * ledger entry in one transaction. Retrying with the same idempotency key returns the original bonus.
 */
export async function createBonus({ labourId, amount, bonusType, reason, internalNote = '', adminId, idempotencyKey }) {
  const { maxAmount } = await getBonusSettings()
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new WalletError('Bonus amount must be a whole number of rupees', { code: 'INVALID_AMOUNT' })
  }
  if (amount > maxAmount) {
    throw new WalletError(`A single bonus can be at most ₹${maxAmount}`, { code: 'BONUS_LIMIT_EXCEEDED' })
  }
  if (!BONUS_TYPES.includes(bonusType)) {
    throw new WalletError('Invalid bonus type', { code: 'INVALID_BONUS_TYPE' })
  }

  const input = { labourId: String(labourId), amount, bonusType, reason: String(reason).trim() }

  const existing = await Bonus.findOne({ createdBy: adminId, idempotencyKey }).lean()
  if (existing) {
    if (!sameRequest(existing, input)) {
      throw new WalletError('This request key was already used for a different bonus', {
        statusCode: 409,
        code: 'IDEMPOTENCY_KEY_REUSED',
      })
    }
    return { bonus: existing, duplicate: true }
  }

  let result
  try {
    result = await runInTransaction(async (session) => {
      // Eligibility is re-checked inside the transaction so a deactivation can't slip in between
      const labour = await User.findById(labourId).select('role isActive').session(session)
      if (!labour) throw new WalletError('Labour not found', { statusCode: 404, code: 'LABOUR_NOT_FOUND' })
      if (labour.role !== USER_ROLES.LABOUR) {
        throw new WalletError('Bonuses can only be given to labour accounts', { statusCode: 422, code: 'NOT_A_LABOUR' })
      }
      if (!labour.isActive) {
        throw new WalletError('This labour account is deactivated', { statusCode: 422, code: 'LABOUR_INACTIVE' })
      }

      const bonusId = new mongoose.Types.ObjectId()
      const bonusCode = newBonusCode()
      const { transaction, summary } = await creditEarnings({
        userId: labour._id,
        amount,
        context: 'BONUS',
        referenceId: bonusId,
        description: `Bonus ${bonusCode}: ${input.reason}`,
        session,
      })
      const [bonus] = await Bonus.create(
        [
          {
            _id: bonusId,
            bonusCode,
            labourId: labour._id,
            amount,
            bonusType,
            reason: input.reason,
            internalNote: String(internalNote || '').trim(),
            createdBy: adminId,
            walletTransactionId: transaction._id,
            idempotencyKey,
          },
        ],
        { session },
      )
      return { bonus: bonus.toObject(), walletSummary: summary }
    })
  } catch (e) {
    // A concurrent retry with the same key won the unique-index race — its transaction already committed
    if (e?.code === 11000) {
      const raced = await Bonus.findOne({ createdBy: adminId, idempotencyKey }).lean()
      if (raced && sameRequest(raced, input)) return { bonus: raced, duplicate: true }
      throw new WalletError('Duplicate bonus request — refresh and try again', { statusCode: 409, code: 'DUPLICATE_BONUS' })
    }
    throw e
  }

  // Notify only after commit (transaction callbacks may be retried)
  sendNotificationToUser(result.bonus.labourId, {
    title: 'You received a bonus 🎉',
    body: `₹${amount} has been added to your wallet — ${input.reason}`,
    data: { type: 'bonus_credited', bonusId: String(result.bonus._id) },
  }).catch(() => {})

  return { ...result, duplicate: false }
}

/**
 * Reverse a credited bonus with a compensating debit — the original credit is never deleted.
 * Taken from earnings first, then recharge; anything uncovered becomes dues recovered from future credits.
 */
export async function reverseBonus({ bonusId, adminId, reason }) {
  const result = await runInTransaction(async (session) => {
    const bonus = await Bonus.findOneAndUpdate(
      { _id: bonusId, status: BONUS_STATUS.CREDITED },
      {
        $set: {
          status: BONUS_STATUS.REVERSED,
          reversedAt: new Date(),
          reversedBy: adminId,
          reversalReason: reason,
        },
      },
      { new: true, session },
    )
    if (!bonus) {
      const exists = await Bonus.exists({ _id: bonusId }).session(session)
      throw exists
        ? new WalletError('This bonus has already been reversed', { statusCode: 409, code: 'ALREADY_REVERSED' })
        : new WalletError('Bonus not found', { statusCode: 404, code: 'BONUS_NOT_FOUND' })
    }

    const { transaction, summary, uncovered } = await debitWallet({
      userId: bonus.labourId,
      amount: bonus.amount,
      context: 'BONUS_REVERSAL',
      referenceId: bonus._id,
      description: `Bonus ${bonus.bonusCode} reversed: ${reason}`,
      order: ['self', 'recharge'],
      session,
    })
    bonus.reversalTransactionId = transaction._id
    await bonus.save({ session })
    return { bonus: bonus.toObject(), walletSummary: summary, uncovered }
  })

  sendNotificationToUser(result.bonus.labourId, {
    title: 'Bonus reversed',
    body: `₹${result.bonus.amount} bonus (${result.bonus.bonusCode}) was reversed — ${reason}`,
    data: { type: 'bonus_reversed', bonusId: String(result.bonus._id) },
  }).catch(() => {})

  return result
}
