import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Gift, Loader2, Search, X } from 'lucide-react'
import { fetchAdminUsers } from '../../../api/adminUsersApi.js'
import { adminBonusesApi } from '../../../api/adminBonusesApi.js'
import { ApiError } from '../../../api/http.js'
import { BONUS_TYPE_LABELS, formatRupees } from '../../../lib/walletLabels.js'
import { BonusTypeSelect } from './BonusTypeSelect.jsx'
import { BonusTypePill } from './BonusTypePill.jsx'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500'

/** One key per award operation; crypto.randomUUID is unavailable on plain-http LAN dev hosts */
function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function KycPill({ status }) {
  const styles = {
    verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    failed: 'bg-rose-50 text-rose-700 ring-rose-200/80',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${styles[status] || 'bg-amber-50 text-amber-800 ring-amber-200/80'}`}>
      KYC {status || 'pending'}
    </span>
  )
}

export function GiveBonusModal({ maxAmount = 10000, onClose, onCreated }) {
  const [step, setStep] = useState('form')
  const [labour, setLabour] = useState(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [bonusType, setBonusType] = useState('performance')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const [idempotencyKey, setIdempotencyKey] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Debounced labour search (active labour accounts only)
  useEffect(() => {
    if (labour) return undefined
    let cancelled = false
    const t = window.setTimeout(() => {
      setSearching(true)
      fetchAdminUsers({ role: 'labour', status: 'active', search, limit: 8 })
        .then((data) => {
          if (!cancelled) setResults(data?.items ?? [])
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [search, labour])

  const numericAmount = Number(amount)
  const amountValid = Number.isInteger(numericAmount) && numericAmount >= 1 && numericAmount <= maxAmount
  const canReview = Boolean(labour) && amountValid && reason.trim().length > 0

  function goToReview(e) {
    e.preventDefault()
    setError('')
    if (!canReview) {
      setError(
        !labour
          ? 'Select a labourer.'
          : !amountValid
            ? `Enter a whole amount between ₹1 and ₹${maxAmount}.`
            : 'A reason is required — the labourer will see it.',
      )
      return
    }
    // New key per reviewed award; retries of this same confirmation reuse it
    setIdempotencyKey(newIdempotencyKey())
    setStep('review')
  }

  async function confirm() {
    setSaving(true)
    setError('')
    try {
      const res = await adminBonusesApi.create(
        {
          labourId: labour._id,
          amount: numericAmount,
          bonusType,
          reason: reason.trim(),
          internalNote: internalNote.trim(),
        },
        idempotencyKey,
      )
      onCreated?.(res.data.bonus, { labour, duplicate: res.data.duplicate })
    } catch (err) {
      // Keep the same key — retrying can never credit twice
      setError(err instanceof ApiError ? err.message : 'Could not credit the bonus. Try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close" onClick={saving ? undefined : onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-bonus-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Gift className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="give-bonus-title" className="text-base font-extrabold text-slate-900">
                {step === 'review' ? 'Confirm bonus' : 'Give bonus'}
              </h2>
              <p className="text-xs text-slate-500">Credited instantly to the labourer’s wallet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={goToReview} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label className={labelClass}>Labourer</label>
                {labour ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{labour.fullName || '—'}</p>
                      <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-slate-600">
                        +91 {labour.phone} <KycPill status={labour.labourProfile?.kycStatus} />
                      </p>
                    </div>
                    <button type="button" onClick={() => setLabour(null)} className="shrink-0 text-xs font-bold text-brand">
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200">
                    <div className="relative border-b border-slate-100">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        autoFocus
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search active labour by name or mobile…"
                        className="w-full rounded-t-xl bg-white py-2.5 pl-10 pr-3 text-sm outline-none"
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                      {searching ? (
                        <li className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                        </li>
                      ) : results.length === 0 ? (
                        <li className="px-4 py-3 text-xs text-slate-500">No active labour found</li>
                      ) : (
                        results.map((u) => (
                          <li key={u._id}>
                            <button
                              type="button"
                              onClick={() => setLabour(u)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900">{u.fullName || '—'}</span>
                                <span className="font-mono text-xs text-slate-500">+91 {u.phone}</span>
                              </span>
                              <KycPill status={u.labourProfile?.kycStatus} />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label id="bonus-type-label" className={labelClass} htmlFor="bonus-type">Bonus type</label>
                  <BonusTypeSelect id="bonus-type" value={bonusType} onChange={setBonusType} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="bonus-amount">Amount (₹)</label>
                  <input
                    id="bonus-amount"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={maxAmount}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`1 – ${maxAmount}`}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="bonus-reason">
                  Reason <span className="normal-case text-slate-400">(shown to the labourer)</span>
                </label>
                <textarea
                  id="bonus-reason"
                  rows={2}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Excellent service performance in October"
                  className={`${inputClass} resize-none`}
                />
                <p className="mt-1 text-right text-[10px] text-slate-400">{reason.length}/500</p>
              </div>

              <div>
                <label className={labelClass} htmlFor="bonus-note">
                  Internal note <span className="normal-case text-slate-400">(admins only, optional)</span>
                </label>
                <textarea
                  id="bonus-note"
                  rows={2}
                  maxLength={1000}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canReview}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                Review bonus
              </button>
            </div>
          </form>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="flex justify-center">
                  <BonusTypePill type={bonusType} />
                </div>
                <p className="mt-2 font-mono text-3xl font-black text-emerald-700">{formatRupees(numericAmount)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  to {labour.fullName} <span className="font-mono text-xs text-slate-500">+91 {labour.phone}</span>
                </p>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className={labelClass}>Reason</dt>
                  <dd className="text-slate-800">{reason.trim()}</dd>
                </div>
                {internalNote.trim() ? (
                  <div>
                    <dt className={labelClass}>Internal note</dt>
                    <dd className="text-slate-600">{internalNote.trim()}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900 ring-1 ring-blue-100">
                The amount is added to the labourer’s wallet as withdrawable earnings (any outstanding cash-job dues are recovered
                first). This is an internal wallet credit, not a bank transfer. You can reverse it later from the bonus details.
              </p>
              {error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
            </div>
            <div className="flex justify-between gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setStep('form')
                  setIdempotencyKey(null)
                  setError('')
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirm}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Crediting…' : error ? 'Retry' : 'Confirm & credit'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
