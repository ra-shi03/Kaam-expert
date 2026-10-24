import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Ban, Check, ChevronLeft, ChevronRight, Gift, Loader2, RefreshCw, Search, Users } from 'lucide-react'
import { adminReferralsApi } from '../../api/adminReferralsApi.js'
import { adminSettingsApi } from '../../api/adminSettingsApi.js'
import { ApiError } from '../../api/http.js'
import { ROLE_LABELS } from '../../constants/userRoles.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500'

const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  REWARDED: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200/80',
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${STATUS_STYLES[status] || ''}`}>
      {status?.toLowerCase()}
    </span>
  )
}

function PersonCell({ person, extra }) {
  if (!person) return <span className="text-xs text-slate-400">Deleted user</span>
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-900">{person.fullName || '—'}</p>
      <p className="font-mono text-xs tabular-nums text-slate-500">
        {person.phone ? `+91 ${person.phone}` : '—'} · {ROLE_LABELS[person.role] || person.role}
      </p>
      {extra}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <GlassPanel className="px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{value}</p>
    </GlassPanel>
  )
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function ToggleRow({ title, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">{checked ? 'On' : 'Off'}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${checked ? 'bg-brand' : 'bg-slate-200'}`}
        >
          <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  )
}

function ProgramSettings() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [togglingKey, setTogglingKey] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    adminSettingsApi
      .getSettings()
      .then((res) => {
        const r = res.data?.settings?.referral || {}
        setForm({
          isEnabled: r.isEnabled ?? true,
          showInApp: r.showInApp ?? true,
          referrerReward: String(r.referrerReward ?? 50),
          refereeReward: String(r.refereeReward ?? 25),
          rewardTrigger: r.rewardTrigger || 'FIRST_COMPLETED_JOB',
        })
      })
      .catch((e) => setNotice({ type: 'error', text: e instanceof ApiError ? e.message : 'Could not load settings' }))
  }, [])

  /** Switches apply immediately, so admins don't have to remember to hit Save to hide the feature */
  async function saveToggle(key, value, label) {
    setTogglingKey(key)
    setNotice(null)
    setForm((f) => ({ ...f, [key]: value }))
    try {
      await adminSettingsApi.updateReferralSettings({ [key]: value })
      setNotice({ type: 'success', text: `${label} turned ${value ? 'on' : 'off'}` })
    } catch (e) {
      setForm((f) => ({ ...f, [key]: !value }))
      setNotice({ type: 'error', text: e instanceof ApiError ? e.message : 'Could not update setting' })
    } finally {
      setTogglingKey(null)
    }
  }

  async function save() {
    setSaving(true)
    setNotice(null)
    try {
      await adminSettingsApi.updateReferralSettings({
        referrerReward: Number(form.referrerReward) || 0,
        refereeReward: Number(form.refereeReward) || 0,
        rewardTrigger: form.rewardTrigger,
      })
      setNotice({ type: 'success', text: 'Referral settings saved' })
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof ApiError ? e.message : 'Could not save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <GlassPanel className="p-5">
        {notice ? <p className="text-sm text-rose-700">{notice.text}</p> : <div className="h-24 animate-pulse rounded-xl bg-slate-200/60" />}
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
        <h3 className="text-sm font-extrabold text-slate-900">Program settings</h3>
        <p className="text-xs text-slate-500">Rewards are credited (₹) to both users’ wallets</p>
      </div>
      <div className="divide-y divide-slate-100 border-b border-slate-100 px-5 py-4">
        <ToggleRow
          title="Show in user app"
          description="Show Refer & earn in the customer, contractor and labour apps (menu, profile, signup). Referral data stays visible here either way."
          checked={form.showInApp}
          disabled={togglingKey === 'showInApp'}
          onChange={(v) => saveToggle('showInApp', v, 'Show in user app')}
        />
        <ToggleRow
          title="Rewards active"
          description="When off, new referral codes are not accepted and pending referrals don’t pay out."
          checked={form.isEnabled}
          disabled={togglingKey === 'isEnabled'}
          onChange={(v) => saveToggle('isEnabled', v, 'Rewards')}
        />
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-3">
        <div>
          <label className={labelClass}>Referrer reward (₹)</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.referrerReward}
            onChange={(e) => setForm((f) => ({ ...f, referrerReward: e.target.value }))}
          />
          <p className="mt-1 text-[11px] text-slate-500">Paid to the person who shared the link</p>
        </div>
        <div>
          <label className={labelClass}>New user reward (₹)</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.refereeReward}
            onChange={(e) => setForm((f) => ({ ...f, refereeReward: e.target.value }))}
          />
          <p className="mt-1 text-[11px] text-slate-500">Paid to the person who signed up</p>
        </div>
        <div>
          <label className={labelClass}>Reward when</label>
          <select
            className={inputClass}
            value={form.rewardTrigger}
            onChange={(e) => setForm((f) => ({ ...f, rewardTrigger: e.target.value }))}
          >
            <option value="FIRST_COMPLETED_JOB">First booking / job is completed</option>
            <option value="SIGNUP">Immediately on signup</option>
          </select>
          <p className="mt-1 text-[11px] text-slate-500">“First completed” is safer against fake signups</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3">
        {notice ? (
          <p className={`text-xs font-semibold ${notice.type === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{notice.text}</p>
        ) : null}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Save rewards
        </button>
      </div>
    </GlassPanel>
  )
}

export function AdminReferralsPage() {
  const reduce = useReducedMotion()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 15

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminReferralsApi.list({ status, search: debouncedSearch, page, limit })
      setItems(res.data?.items ?? [])
      setTotal(res.data?.total ?? 0)
      setPages(res.data?.pages ?? 1)
      setStats(res.data?.stats ?? null)
    } catch (e) {
      setItems([])
      setError(e instanceof ApiError ? e.message : 'Could not load referrals')
    } finally {
      setLoading(false)
    }
  }, [status, debouncedSearch, page, limit])

  useEffect(() => {
    load()
  }, [load])

  async function handleApprove(r) {
    if (!window.confirm(`Reward this referral now? Both wallets will be credited at the current reward amounts.`)) return
    setActingId(r._id)
    try {
      await adminReferralsApi.approve(r._id)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not approve referral')
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(r) {
    const reason = window.prompt('Reason for rejecting this referral (optional):', '')
    if (reason === null) return
    setActingId(r._id)
    try {
      await adminReferralsApi.reject(r._id, reason.trim() || undefined)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reject referral')
    } finally {
      setActingId(null)
    }
  }

  function renderActions(r, compact) {
    if (r.status !== 'PENDING') {
      return r.status === 'REJECTED' && r.rejectedReason ? (
        <span className="text-[11px] text-slate-500" title={r.rejectedReason}>
          {compact ? r.rejectedReason : 'Has reason'}
        </span>
      ) : null
    }
    const busy = actingId === r._id
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleApprove(r)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" aria-hidden /> Reward
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => handleReject(r)}
          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200/80 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <Ban className="h-3.5 w-3.5" aria-hidden /> Reject
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-bright text-white shadow-lg ring-4 ring-brand/10">
            <Gift className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Referrals</h1>
            <p className="text-sm text-slate-500">Refer & earn program across customer, contractor and labour apps</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </motion.div>

      <ProgramSettings />

      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Total referrals" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Rewarded" value={stats.rewarded} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Total paid out" value={`₹${stats.totalPaidOut}`} />
        </div>
      ) : null}

      <GlassPanel className="p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className={labelClass}>Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Referral code, name or mobile number…"
                className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none ring-slate-200/80 focus:ring-2 focus:ring-brand/35"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand/35"
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="REWARDED">Rewarded</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-500">
          Showing {items.length} of {total} referral{total === 1 ? '' : 's'}
          {debouncedSearch ? ` · matching “${debouncedSearch}”` : ''}
        </p>
      </GlassPanel>

      {error ? (
        <p className="rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">{error}</p>
      ) : null}

      {/* Desktop table */}
      <GlassPanel className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Referred by</th>
                <th className="px-4 py-3">New user</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-200/80" />
                        </td>
                      ))}
                    </tr>
                  ))
                : items.map((r) => (
                    <tr key={r._id} className="border-b border-slate-100 transition hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <PersonCell
                          person={r.referrerId}
                          extra={<p className="mt-0.5 font-mono text-[11px] font-bold tracking-wider text-brand">{r.code}</p>}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <PersonCell person={r.refereeId} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {r.status === 'REWARDED' ? (
                          <>
                            <span className="font-semibold">₹{r.referrerReward}</span> + <span className="font-semibold">₹{r.refereeReward}</span>
                            <p className="text-[11px] text-slate-500">{formatDate(r.rewardedAt)}</p>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {renderActions(r)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Users className="h-10 w-10 text-slate-300" aria-hidden />
            <p className="font-semibold text-slate-700">No referrals found</p>
          </div>
        ) : null}
      </GlassPanel>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <GlassPanel key={i} className="p-4">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-200/80" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200/60" />
              </GlassPanel>
            ))
          : items.map((r) => (
              <GlassPanel key={r._id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <PersonCell person={r.refereeId} />
                  <StatusPill status={r.status} />
                </div>
                <p className="text-xs text-slate-600">
                  Referred by <span className="font-semibold text-slate-900">{r.referrerId?.fullName || '—'}</span>{' '}
                  <span className="font-mono font-bold text-brand">{r.code}</span>
                </p>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-500">
                    {r.status === 'REWARDED' ? `₹${r.referrerReward} + ₹${r.refereeReward}` : formatDate(r.createdAt)}
                  </span>
                  {renderActions(r, true)}
                </div>
              </GlassPanel>
            ))}
        {!loading && items.length === 0 ? (
          <GlassPanel className="p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 font-semibold text-slate-700">No referrals found</p>
          </GlassPanel>
        ) : null}
      </div>

      {pages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">
            Page {page} of {pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Prev
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
