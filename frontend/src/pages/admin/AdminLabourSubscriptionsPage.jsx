import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  Loader2,
  RefreshCw,
  RotateCcw,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { adminLabourSubscriptionsApi } from '../../api/adminLabourSubscriptionsApi.js'
import { adminSettingsApi } from '../../api/adminSettingsApi.js'

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, variant = 'success' }) {
  if (!message) return null
  const styles =
    variant === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
  const Icon = variant === 'error' ? AlertTriangle : CheckCircle2
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed left-4 right-4 top-20 z-50 mx-auto flex max-w-lg items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${styles}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </motion.div>
  )
}

function getCurrentISTHour() {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }))
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = 'brand', loading }) {
  const accents = {
    brand: 'from-brand/10 to-brand/5 border-brand/20 text-brand',
    emerald: 'from-emerald-500/10 to-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'from-amber-500/10 to-amber-50 border-amber-200 text-amber-700',
    rose: 'from-rose-500/10 to-rose-50 border-rose-200 text-rose-700',
    slate: 'from-slate-100 to-white border-slate-200 text-slate-600',
  }
  return (
    <GlassPanel className={`bg-gradient-to-br border p-4 ${accents[accent]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
          {loading ? (
            <div className="mt-1 h-7 w-24 animate-pulse rounded bg-current/20" />
          ) : (
            <p className="mt-1 text-2xl font-black">{value}</p>
          )}
          {sub && !loading && <p className="mt-0.5 text-xs font-medium opacity-60">{sub}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </GlassPanel>
  )
}

// ─── Refund Status Badge ────────────────────────────────────────────────────
function RefundBadge({ status }) {
  const map = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    processing: 'bg-sky-50 text-sky-800 ring-sky-200',
    refunded: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    failed: 'bg-rose-50 text-rose-800 ring-rose-200',
    manually_approved: 'bg-blue-50 text-blue-800 ring-blue-200',
    manually_rejected: 'bg-slate-100 text-slate-600 ring-slate-200',
    not_eligible: 'bg-slate-50 text-slate-500 ring-slate-200',
  }
  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    refunded: 'Refunded',
    failed: 'Failed',
    manually_approved: 'Approved',
    manually_rejected: 'Rejected',
    not_eligible: 'Not Eligible',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  )
}

// ─── Refund Action Modal ────────────────────────────────────────────────────
function RefundModal({ sub, onClose, onDone }) {
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handle(act) {
    setAction(act)
    setLoading(true)
    setErr('')
    try {
      await adminLabourSubscriptionsApi.processRefund(sub._id, act, note)
      onDone(`Refund ${act}d successfully`)
    } catch (e) {
      setErr(e?.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-base font-extrabold text-slate-900">Refund Action</p>
            <p className="text-xs text-slate-500">{sub.labour?.fullName || 'Labour'} — {sub.date}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {/* Info row */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-500">Amount Paid</p>
              <p className="mt-1 text-lg font-black text-slate-900">₹{sub.amountPaid}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Bookings</p>
              <p className="mt-1 text-lg font-black text-slate-900">{sub.bookingsReceived || 0}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Offers</p>
              <p className="mt-1 text-lg font-black text-slate-900">{sub.bookingOpportunitiesOffered || 0}</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Admin Note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for action..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {err && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{err}</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handle('reject')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
            >
              {loading && action === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Reject
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handle('approve')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {loading && action === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handle('process')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand/90 disabled:opacity-50"
            >
              {loading && action === 'process' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
              Process
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            "Process" will immediately credit ₹{sub.amountPaid} to labour wallet.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Subscription Plan Modal ────────────────────────────────────────────────
function SubscriptionPlanModal({ plan, onClose, onDone }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: plan?.name || '',
    durationDays: plan?.durationDays || 7,
    price: plan?.price || 99,
    features: plan?.features?.join(', ') || '',
    isActive: plan?.isActive ?? true,
  })

  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        features: form.features.split(',').map(f => f.trim()).filter(Boolean)
      }
      if (plan) {
        await adminLabourSubscriptionsApi.updatePlan(plan._id, payload)
      } else {
        await adminLabourSubscriptionsApi.createPlan(payload)
      }
      onDone(plan ? 'Plan updated' : 'Plan created')
    } catch (error) {
      setErr(error.message || 'Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4 pb-3">
          <h3 className="text-lg font-bold text-slate-800">{plan ? 'Edit Plan' : 'Create Plan'}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {err && <p className="text-sm text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{err}</p>}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Plan Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-brand" placeholder="e.g. 1 Week" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">Duration (Days)</label>
              <input type="number" required min="1" value={form.durationDays} onChange={e => setForm({...form, durationDays: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-brand" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">Price (₹)</label>
              <input type="number" required min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Features (comma separated)</label>
            <textarea required value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={3} className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-brand" placeholder="Access to jobs, Priority support..." />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="h-4 w-4 rounded text-brand focus:ring-brand" />
            Plan is Active
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white hover:bg-brand/90 flex items-center justify-center">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Plan'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function AdminLabourSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [refundEligible, setRefundEligible] = useState([])
  const [history, setHistory] = useState([])
  const [total, setTotal] = useState(0)
  const [plans, setPlans] = useState([])
  const [settings, setSettings] = useState(null)
  const [currentHour, setCurrentHour] = useState(getCurrentISTHour())
  const [page, setPage] = useState(1)
  const LIMIT = 30

  // Filters
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  const [statusFilter, setStatusFilter] = useState('all')
  const [refundStatusFilter, setRefundStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Modal
  const [actionSub, setActionSub] = useState(null)

  const [toast, setToast] = useState({ message: '', variant: 'success' })
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const showToast = useCallback((message, variant = 'success') => {
    setToast({ message, variant })
    setTimeout(() => setToast({ message: '', variant: 'success' }), 4000)
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const [res, settingsRes] = await Promise.all([
        adminLabourSubscriptionsApi.getStats({ date: selectedDate !== new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) ? selectedDate : undefined }),
        adminSettingsApi.getSettings()
      ])
      setStats(res?.data || null)
      setSettings(settingsRes?.data?.settings || null)
    } catch (e) {
      console.error('Failed to fetch stats/settings', e)
    }
  }, [selectedDate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'subscriptions') {
        const res = await adminLabourSubscriptionsApi.getSubscriptions({
          date: selectedDate,
          status: statusFilter,
          refundStatus: refundStatusFilter,
          search,
          page,
          limit: LIMIT,
        })
        setSubscriptions(res?.data?.subscriptions || [])
        setTotal(res?.data?.total || 0)
      } else if (activeTab === 'refund-eligible') {
        const res = await adminLabourSubscriptionsApi.getRefundEligible({ date: selectedDate })
        setRefundEligible(res?.data?.subscriptions || [])
      } else if (activeTab === 'history') {
        const res = await adminLabourSubscriptionsApi.getRefundHistory({ date: selectedDate !== new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) ? selectedDate : undefined, page })
        setHistory(res?.data?.subscriptions || [])
        setTotal(res?.data?.total || 0)
      } else if (activeTab === 'plans') {
        const res = await adminLabourSubscriptionsApi.getPlans()
        setPlans(res?.data?.plans || [])
      }
    } catch (e) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedDate, statusFilter, refundStatusFilter, search, page, showToast])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return
    try {
      await adminLabourSubscriptionsApi.deletePlan(id)
      showToast('Plan deleted successfully', 'success')
      fetchData()
    } catch (e) {
      showToast('Failed to delete plan', 'error')
    }
  }

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(getCurrentISTHour()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const pages = Math.ceil(total / LIMIT)

  const TABS = [
    { id: 'subscriptions', label: 'All Subscriptions', icon: Users },
    { id: 'refund-eligible', label: 'Refund Eligible', icon: RotateCcw },
    { id: 'history', label: 'Refund History', icon: Clock },
    { id: 'plans', label: 'Subscription Plans', icon: Shield },
  ]

  function formatHour(h) {
    if (h == null) return '—'
    const suffix = h >= 12 ? 'PM' : 'AM'
    const display = h % 12 || 12
    return `${display}:00 ${suffix}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-7xl space-y-5"
    >
      <AnimatePresence>
        {toast.message && <Toast message={toast.message} variant={toast.variant} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Labour Subscriptions</h1>
          <p className="text-sm text-slate-500">Daily subscription management, refund eligibility & processing</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setPage(1) }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            onClick={() => { fetchStats(); fetchData() }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand/30 hover:text-brand"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard icon={Users} label="Total Today" value={stats?.totalToday ?? '—'} loading={!stats} accent="brand" />
        <StatCard icon={Shield} label="Active" value={stats?.activeToday ?? '—'} loading={!stats} accent="emerald" />
        <StatCard icon={IndianRupee} label="Revenue" value={stats ? `₹${stats.totalRevenue}` : '—'} loading={!stats} accent="brand" />
        <StatCard icon={RotateCcw} label="Refunded" value={stats?.refundedToday ?? '—'} sub={stats ? `₹${stats.totalRefunded}` : ''} loading={!stats} accent="amber" />
        <StatCard icon={BadgeIndianRupee} label="Net Revenue" value={stats ? `₹${stats.netRevenue}` : '—'} loading={!stats} accent="emerald" />
        <StatCard icon={AlertTriangle} label="Pending Refund" value={stats?.pendingRefund ?? '—'} loading={!stats} accent="rose" />
        <StatCard icon={TrendingUp} label="Rejected" value={stats?.rejectedRefund ?? '—'} loading={!stats} accent="slate" />
      </div>

      {/* Subscription Window */}
      {settings?.isUserSubscriptionEnabled && (
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-brand" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Subscription Window</h2>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-slate-400">Opens</p>
              <p className="text-xl font-black text-slate-900">{formatHour(settings.subscriptionStartHour)}</p>
            </div>
            <div className="flex-1 mx-6 h-1 bg-slate-100 relative rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-brand rounded-full transition-all duration-1000"
                style={{
                  width: (currentHour >= settings.subscriptionStartHour && currentHour < settings.subscriptionEndHour)
                    ? `${Math.min(100, ((currentHour - settings.subscriptionStartHour) / (settings.subscriptionEndHour - settings.subscriptionStartHour)) * 100)}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Closes</p>
              <p className="text-xl font-black text-slate-900">{formatHour(settings.subscriptionEndHour)}</p>
            </div>
          </div>
          {(currentHour >= settings.subscriptionStartHour && currentHour < settings.subscriptionEndHour) ? (
            <p className="mt-4 text-center text-sm font-bold text-emerald-700">
              ● Window is currently open — subscribe now!
            </p>
          ) : (
            <p className="mt-4 text-center text-sm font-bold text-slate-500">
              ● Window is currently closed
            </p>
          )}
        </GlassPanel>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActiveTab(id); setPage(1) }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Filters (only on subscriptions tab) */}
      {activeTab === 'subscriptions' && (
        <GlassPanel className="flex flex-wrap gap-3 p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name or phone..."
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={refundStatusFilter}
            onChange={(e) => { setRefundStatusFilter(e.target.value); setPage(1) }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Refund Status</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
            <option value="manually_approved">Approved</option>
            <option value="manually_rejected">Rejected</option>
            <option value="not_eligible">Not Eligible</option>
          </select>
        </GlassPanel>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : activeTab === 'refund-eligible' ? (
        /* ── Refund Eligible Table ── */
        <GlassPanel className="overflow-hidden rounded-3xl p-0">
          {refundEligible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-300" />
              <p className="font-semibold text-slate-700">No pending refunds for {selectedDate}</p>
              <p className="text-sm text-slate-500">All subscriptions have been settled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Labour</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Bookings</th>
                    <th className="px-5 py-3">Window</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundEligible.map((sub) => (
                    <tr key={sub._id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-900">{sub.labour?.fullName || '—'}</p>
                        <p className="text-xs text-slate-500">+91 {sub.labour?.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3 font-black text-brand">₹{sub.amountPaid}</td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-900">{sub.bookingsReceived || 0}</span>
                        <span className="text-slate-400"> received / </span>
                        <span className="font-semibold text-slate-600">{sub.bookingOpportunitiesOffered || 0}</span>
                        <span className="text-slate-400"> offered</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {formatHour(sub.subscriptionStartHour)} – {formatHour(sub.subscriptionEndHour)}
                      </td>
                      <td className="px-5 py-3"><RefundBadge status={sub.refundStatus} /></td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setActionSub(sub)}
                          className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand/90"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      ) : activeTab === 'subscriptions' || activeTab === 'history' ? (
        /* ── Subscriptions / History Table ── */
        <GlassPanel className="overflow-hidden rounded-3xl p-0">
          {(activeTab === 'subscriptions' ? subscriptions : history).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Users className="h-12 w-12 text-slate-200" />
              <p className="font-semibold text-slate-700">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Labour</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Transaction ID</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Bookings</th>
                    <th className="px-5 py-3">Sub Status</th>
                    <th className="px-5 py-3">Refund Status</th>
                    {activeTab === 'history' && <th className="px-5 py-3">By Admin</th>}
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeTab === 'subscriptions' ? subscriptions : history).map((sub) => {
                    const canManage = sub.refundEligibility &&
                      ['pending', 'processing', 'failed', 'manually_approved'].includes(sub.refundStatus)
                    return (
                      <tr key={sub._id} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900">{sub.labour?.fullName || '—'}</p>
                          <p className="text-xs text-slate-500">+91 {sub.labour?.phone || '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-600">{sub.date}</td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-500">
                          {sub.transactionId ? (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5">{sub.transactionId}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-3 font-black text-brand">₹{sub.amountPaid}</td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-900">{sub.bookingsReceived || 0}</span>
                          <span className="text-slate-400 text-xs"> / {sub.bookingOpportunitiesOffered || 0} offered</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                            sub.status === 'active' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' :
                            sub.status === 'refunded' ? 'bg-sky-50 text-sky-800 ring-sky-200' :
                            'bg-slate-100 text-slate-600 ring-slate-200'
                          }`}>
                            {sub.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3"><RefundBadge status={sub.refundStatus} /></td>
                        {activeTab === 'history' && (
                          <td className="px-5 py-3 text-xs text-slate-600">{sub.adminActionBy?.fullName || 'System'}</td>
                        )}
                        <td className="px-5 py-3">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => setActionSub(sub)}
                              className="rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand/90"
                            >
                              Manage
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      ) : activeTab === 'plans' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditingPlan(null); setShowPlanModal(true); }} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand/90">
              + Add Subscription
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <GlassPanel key={plan._id} className="relative p-5 flex flex-col h-full">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {!plan.isActive && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200">
                      INACTIVE
                    </span>
                  )}
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="text-xl font-black text-slate-800 pr-16">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-brand">₹{plan.price}</span>
                  <span className="text-sm font-semibold text-slate-500">/ {plan.durationDays} days</span>
                </div>
                <ul className="mt-4 mb-6 flex-1 space-y-2 text-sm text-slate-600">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }}
                  className="mt-auto w-full rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-700 transition hover:border-brand hover:text-brand"
                >
                  Edit Plan
                </button>
              </GlassPanel>
            ))}
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">Page {page} of {pages} ({total} total)</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Refund Action Modal */}
      {actionSub && (
        <RefundModal
          sub={actionSub}
          onClose={() => setActionSub(null)}
          onDone={(msg) => {
            setActionSub(null)
            showToast(msg, 'success')
            fetchStats()
            fetchData()
          }}
        />
      )}

      {/* Subscription Plan Modal */}
      {showPlanModal && (
        <SubscriptionPlanModal
          plan={editingPlan}
          onClose={() => setShowPlanModal(false)}
          onDone={(msg) => {
            setShowPlanModal(false)
            showToast(msg, 'success')
            fetchData()
          }}
        />
      )}
    </motion.div>
  )
}
