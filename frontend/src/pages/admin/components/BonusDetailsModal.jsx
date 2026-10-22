import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, Undo2, X } from 'lucide-react'
import { adminBonusesApi } from '../../../api/adminBonusesApi.js'
import { ApiError } from '../../../api/http.js'
import { BONUS_TYPE_LABELS, formatRupees } from '../../../lib/walletLabels.js'
import { BonusStatusPill } from './BonusStatusPill.jsx'
import { BonusTypePill } from './BonusTypePill.jsx'

const labelClass = 'text-[11px] font-bold uppercase tracking-wide text-slate-500'

function formatDate(d) {
  return d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <dt className={labelClass}>{label}</dt>
      <dd className="max-w-[65%] text-right text-sm font-medium text-slate-800">{children}</dd>
    </div>
  )
}

export function BonusDetailsModal({ bonusId, onClose, onChanged }) {
  const [bonus, setBonus] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [reversing, setReversing] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let cancelled = false
    adminBonusesApi
      .getById(bonusId)
      .then((res) => {
        if (!cancelled) setBonus(res.data?.bonus || null)
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : 'Could not load bonus')
      })
    return () => {
      cancelled = true
    }
  }, [bonusId, reloadKey])

  async function handleReverse() {
    if (!reason.trim()) {
      setNotice({ type: 'error', text: 'A reason is required to reverse a bonus.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      const res = await adminBonusesApi.reverse(bonusId, reason.trim())
      setNotice({ type: res.data?.uncovered > 0 ? 'warning' : 'success', text: res.message })
      setReversing(false)
      setReloadKey((k) => k + 1)
      onChanged?.()
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof ApiError ? e.message : 'Could not reverse bonus' })
    } finally {
      setSaving(false)
    }
  }

  const labour = bonus?.labourId

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close" onClick={saving ? undefined : onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-details-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="bonus-details-title" className="font-mono text-base font-extrabold text-slate-900">
              {bonus?.bonusCode || 'Bonus'}
            </h2>
            {bonus ? (
              <div className="mt-1">
                <BonusTypePill type={bonus.bonusType} />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {bonus ? <BonusStatusPill status={bonus.status} /> : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loadError ? <p className="text-sm font-semibold text-rose-700">{loadError}</p> : null}
          {!bonus && !loadError ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : null}

          {bonus ? (
            <>
              <div className="mb-3 rounded-2xl bg-slate-50 p-4 text-center">
                <p className={`font-mono text-3xl font-black ${bonus.status === 'REVERSED' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                  {formatRupees(bonus.amount)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {labour?.fullName || 'Deleted user'}{' '}
                  {labour?.phone ? <span className="font-mono text-xs text-slate-500">+91 {labour.phone}</span> : null}
                </p>
              </div>
              <dl>
                <Row label="Reason">{bonus.reason}</Row>
                <Row label="Internal note">{bonus.internalNote || '—'}</Row>
                <Row label="Given by">{bonus.createdBy?.fullName || bonus.createdBy?.email || '—'}</Row>
                <Row label="Credited">{formatDate(bonus.createdAt)}</Row>
                <Row label="Wallet balance after">
                  {typeof bonus.walletTransactionId?.balanceAfter === 'number' ? formatRupees(bonus.walletTransactionId.balanceAfter) : '—'}
                </Row>
                {bonus.status === 'REVERSED' ? (
                  <>
                    <Row label="Reversed">{formatDate(bonus.reversedAt)}</Row>
                    <Row label="Reversed by">{bonus.reversedBy?.fullName || bonus.reversedBy?.email || '—'}</Row>
                    <Row label="Reversal reason">{bonus.reversalReason}</Row>
                    <Row label="Balance after reversal">
                      {typeof bonus.reversalTransactionId?.balanceAfter === 'number'
                        ? formatRupees(bonus.reversalTransactionId.balanceAfter)
                        : '—'}
                    </Row>
                  </>
                ) : null}
              </dl>

              {notice ? (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                    notice.type === 'error'
                      ? 'bg-rose-50 text-rose-700'
                      : notice.type === 'warning'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {notice.text}
                </p>
              ) : null}

              {bonus.status === 'CREDITED' && !reversing ? (
                <button
                  type="button"
                  onClick={() => setReversing(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
                >
                  <Undo2 className="h-4 w-4" /> Reverse bonus
                </button>
              ) : null}

              {reversing ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <p className="flex items-start gap-2 text-xs font-medium text-rose-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {formatRupees(bonus.amount)} will be deducted from the labourer’s wallet. If they have already withdrawn it,
                    the shortfall becomes dues recovered from their future earnings and recharges. The original credit stays in
                    the ledger.
                  </p>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (required) — e.g. Given to the wrong labourer"
                    className="w-full resize-none rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setReversing(false)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving || !reason.trim()}
                      onClick={handleReverse}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                      Confirm reversal
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
