import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BadgeIndianRupee, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, Loader2, Plus, RefreshCw, Search } from 'lucide-react'
import { adminBonusesApi } from '../../api/adminBonusesApi.js'
import { adminSettingsApi } from '../../api/adminSettingsApi.js'
import { ApiError } from '../../api/http.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { BONUS_TYPE_LABELS, formatRupees } from '../../lib/walletLabels.js'
import { GiveBonusModal } from './components/GiveBonusModal.jsx'
import { BonusDetailsModal } from './components/BonusDetailsModal.jsx'
import { BonusStatusPill } from './components/BonusStatusPill.jsx'
import { BonusTypePill } from './components/BonusTypePill.jsx'

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500'
const fieldClass =
  'w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35'

function formatDate(d) {
  return d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function StatCard({ label, value, sub, tone = 'slate' }) {
  const tones = { slate: 'text-slate-900', emerald: 'text-emerald-700', rose: 'text-rose-700' }
  return (
    <GlassPanel className="px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${tones[tone]}`}>{value}</p>
      {sub ? <p className="text-[11px] text-slate-500">{sub}</p> : null}
    </GlassPanel>
  )
}

function MaxAmountSetting({ value, onSaved }) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const shown = draft === '' ? String(value ?? '') : draft

  async function save() {
    const n = Number(shown)
    if (!Number.isInteger(n) || n < 1) {
      setMsg({ type: 'error', text: 'Enter a whole amount of at least ₹1' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      await adminSettingsApi.updateBonusSettings({ maxAmount: n })
      setDraft('')
      setMsg({ type: 'success', text: 'Saved' })
      onSaved?.()
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof ApiError ? e.message : 'Could not save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className={labelClass} htmlFor="max-bonus">Max per bonus (₹)</label>
        <input
          id="max-bonus"
          type="number"
          min="1"
          step="1"
          value={shown}
          onChange={(e) => setDraft(e.target.value)}
          className={`${fieldClass} w-36`}
        />
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving || draft === ''}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save limit
      </button>
      {msg ? (
        <span className={`pb-2.5 text-xs font-semibold ${msg.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{msg.text}</span>
      ) : null}
    </div>
  )
}

export function AdminBonusesPage() {
  const reduce = useReducedMotion()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [bonusType, setBonusType] = useState('all')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showGive, setShowGive] = useState(false)
  const [viewingId, setViewingId] = useState(null)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminBonusesApi.list({ search, bonusType, status, from, to, page, limit })
      setData(res.data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load bonuses')
    } finally {
      setLoading(false)
    }
  }, [search, bonusType, status, from, to, page])

  useEffect(() => {
    load()
  }, [load])

  const items = data?.items ?? []
  const summary = data?.summary
  const maxAmount = data?.settings?.maxAmount ?? 10000

  function resetPageAnd(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg ring-4 ring-emerald-500/10">
            <BadgeIndianRupee className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Bonuses</h1>
            <p className="text-sm text-slate-500">Reward labourers — credited instantly to their wallet</p>
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowGive(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Give bonus
          </button>
        </div>
      </motion.div>

      {flash ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash}
        </p>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total awarded" value={formatRupees(summary.totalAwarded)} sub="Gross, incl. reversed" />
          <StatCard label="Reversed" value={formatRupees(summary.totalReversed)} sub={`${summary.reversedCount} bonus(es)`} tone="rose" />
          <StatCard label="Net credited" value={formatRupees(summary.netCredited)} sub="Still in labour wallets" tone="emerald" />
          <StatCard label="Bonuses credited" value={summary.creditedCount} />
        </div>
      ) : null}

      <GlassPanel className="space-y-4 p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className={labelClass}>Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(1)
                }}
                placeholder="Bonus code, labour name or mobile…"
                className={`${fieldClass} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <div className="relative">
              <select
                value={bonusType}
                onChange={resetPageAnd(setBonusType)}
                className={`${fieldClass} appearance-none pr-9 cursor-pointer transition hover:border-slate-300`}
              >
                <option value="all">All types</option>
                {Object.entries(BONUS_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={resetPageAnd(setStatus)}
                className={`${fieldClass} appearance-none pr-9 cursor-pointer transition hover:border-slate-300`}
              >
                <option value="all">All</option>
                <option value="CREDITED">Credited</option>
                <option value="REVERSED">Reversed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div>
            <label className={labelClass}>From</label>
            <input type="date" value={from} onChange={resetPageAnd(setFrom)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input type="date" value={to} onChange={resetPageAnd(setTo)} className={fieldClass} />
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500">
            Showing {items.length} of {data?.total ?? 0} bonus{data?.total === 1 ? '' : 'es'}
          </p>
          <MaxAmountSetting value={maxAmount} onSaved={load} />
        </div>
      </GlassPanel>

      {error ? (
        <p className="rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">{error}</p>
      ) : null}

      <GlassPanel className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Labour</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-200/80" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.map((b) => (
                    <tr key={b._id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">{b.bonusCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{b.labourId?.fullName || 'Deleted user'}</p>
                        <p className="font-mono text-xs text-slate-500">{b.labourId?.phone ? `+91 ${b.labourId.phone}` : ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <BonusTypePill type={b.bonusType} />
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${b.status === 'REVERSED' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                        {formatRupees(b.amount)}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-xs text-slate-600" title={b.reason}>
                        {b.reason}
                      </td>
                      <td className="px-4 py-3">
                        <BonusStatusPill status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(b.createdAt)}
                        <p className="text-[11px] text-slate-400">by {b.createdBy?.fullName || b.createdBy?.email || 'admin'}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingId(b._id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-brand/10 hover:text-brand"
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <BadgeIndianRupee className="h-10 w-10 text-slate-300" aria-hidden />
            <p className="font-semibold text-slate-700">No bonuses yet</p>
            <p className="text-xs text-slate-500">Use “Give bonus” to reward a labourer.</p>
          </div>
        ) : null}
      </GlassPanel>

      <div className="space-y-3 md:hidden">
        {items.map((b) => (
          <GlassPanel key={b._id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{b.labourId?.fullName || 'Deleted user'}</p>
                <p className="font-mono text-xs text-slate-500">{b.bonusCode}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 sm:flex-row">
                <BonusTypePill type={b.bonusType} />
                <BonusStatusPill status={b.status} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">{b.reason}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className={`font-mono font-bold ${b.status === 'REVERSED' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                {formatRupees(b.amount)}
              </span>
              <button
                type="button"
                onClick={() => setViewingId(b._id)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-brand/10 hover:text-brand"
              >
                <Eye className="size-3.5" /> View
              </button>
            </div>
          </GlassPanel>
        ))}
        {!loading && items.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <p className="font-semibold text-slate-700">No bonuses yet</p>
          </GlassPanel>
        ) : null}
      </div>

      {(data?.pages ?? 1) > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">Page {page} of {data.pages}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
            </button>
            <button
              type="button"
              disabled={page >= data.pages || loading}
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {showGive ? (
        <GiveBonusModal
          maxAmount={maxAmount}
          onClose={() => setShowGive(false)}
          onCreated={(bonus, { labour, duplicate }) => {
            setShowGive(false)
            setFlash(
              duplicate
                ? `This bonus was already credited (${bonus.bonusCode}).`
                : `${formatRupees(bonus.amount)} bonus credited to ${labour.fullName} (${bonus.bonusCode}).`,
            )
            setPage(1)
            load()
          }}
        />
      ) : null}

      {viewingId ? <BonusDetailsModal bonusId={viewingId} onClose={() => setViewingId(null)} onChanged={load} /> : null}
    </div>
  )
}
