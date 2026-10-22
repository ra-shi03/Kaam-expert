import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Briefcase,
  CheckCircle2,
  Gift,
  Landmark,
  Loader2,
  Plus,
  RotateCcw,
  Undo2,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { walletsApi } from '../../api/walletsApi.js'
import { ApiError } from '../../api/http.js'
import { useAuth } from '../../hooks/useAuth.js'
import { payWithRazorpay } from '../../lib/razorpayCheckout.js'
import { BONUS_TYPE_LABELS, WALLET_CONTEXT_LABELS, formatRupees } from '../../lib/walletLabels.js'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { AppSectionHeader } from '../../components/app-ui/layout/AppSectionHeader.jsx'
import { AppBadge } from '../../components/app-ui/data-display/AppBadge.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'

const CONTEXT_ICONS = {
  RECHARGE: Plus,
  CASH_COMMISSION: Banknote,
  BOOKING: Banknote,
  PAYOUT: Briefcase,
  BONUS: Gift,
  BONUS_REVERSAL: Undo2,
  REFERRAL: Users,
  REFUND: RotateCcw,
  WITHDRAWAL: Landmark,
  CLEARANCE: CheckCircle2,
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000]

function formatDateTime(d) {
  return new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function BucketTile({ label, value, tone = 'white' }) {
  const tones = {
    white: 'text-white',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
  }
  return (
    <div className="rounded-xl bg-black/20 px-2.5 py-2 ring-1 ring-white/10">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-black ${tones[tone]}`}>{formatRupees(value)}</p>
    </div>
  )
}

export function LaborWallet() {
  const reduce = useReducedMotion()
  const { realUser } = useAuth()
  const [searchParams] = useSearchParams()

  const [view, setView] = useState(null)
  const [bonuses, setBonuses] = useState([])
  const [ledger, setLedger] = useState({ items: [], page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const requested = Number(searchParams.get('recharge')) || 0
  const [amountInput, setAmountInput] = useState('')
  const [paying, setPaying] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([walletsApi.getMyWallet(), walletsApi.getMyBonuses(), walletsApi.getTransactions({ page: 1, limit: 15 })])
      .then(([walletRes, bonusRes, txRes]) => {
        if (cancelled) return
        setView(walletRes.data)
        setBonuses(bonusRes.data?.bonuses || [])
        setLedger(txRes.data || { items: [], page: 1, pages: 1 })
        setLoadError('')
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Failed to load wallet')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const cfg = view?.cashWallet
  const summary = view?.summary
  const minRecharge = cfg?.minRecharge ?? 100
  const maxRecharge = cfg?.maxRecharge ?? 10000

  // A shortfall from a blocked cash job (?recharge=70) is rounded up to the minimum allowed recharge
  const suggested = requested > 0 ? Math.min(maxRecharge, Math.max(minRecharge, Math.ceil(requested))) : 0
  const amount = amountInput === '' ? suggested || '' : amountInput
  const numericAmount = Number(amount)
  const amountValid = Number.isInteger(numericAmount) && numericAmount >= minRecharge && numericAmount <= maxRecharge

  const quickAmounts = useMemo(() => {
    const list = QUICK_AMOUNTS.filter((a) => a >= minRecharge && a <= maxRecharge)
    return suggested && !list.includes(suggested) ? [suggested, ...list] : list
  }, [minRecharge, maxRecharge, suggested])

  async function handleRecharge() {
    if (!amountValid) {
      setNotice({ type: 'error', text: `Enter a whole amount between ₹${minRecharge} and ₹${maxRecharge}.` })
      return
    }
    setPaying(true)
    setNotice(null)
    try {
      const res = await payWithRazorpay({
        amount: numericAmount,
        purpose: 'WALLET_RECHARGE',
        description: 'Wallet recharge',
        prefill: { name: realUser?.fullName || '', contact: realUser?.phone || '' },
      })
      if (res) {
        setNotice({ type: 'success', text: `₹${numericAmount} added to your wallet.` })
        setAmountInput('')
        setReloadKey((k) => k + 1)
      }
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof ApiError ? err.message : err.message || 'Recharge failed' })
    } finally {
      setPaying(false)
    }
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await walletsApi.getTransactions({ page: ledger.page + 1, limit: 15 })
      setLedger((prev) => ({ ...res.data, items: [...prev.items, ...(res.data?.items || [])] }))
    } catch {
      // keep what is already shown
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Wallet" backTo="/app/earnings" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <AppStackScreenHeader title="Wallet" backTo="/app/earnings" />
        <GlassPanel className="p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setReloadKey((k) => k + 1)
            }}
            className="mt-3 text-sm font-bold text-brand"
          >
            Try again
          </button>
        </GlassPanel>
      </div>
    )
  }

  const negative = summary.balance < 0
  const statusChip = !cfg.isEnabled
    ? { text: 'Cash jobs open to all', cls: 'bg-white/10 text-white/80 ring-white/20' }
    : cfg.canTakeCashJobs
      ? { text: 'Cash jobs on', cls: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30' }
      : { text: 'Recharge to take cash jobs', cls: 'bg-amber-500/15 text-amber-200 ring-amber-400/30' }

  return (
    <div className="space-y-5 pb-8">
      <AppStackScreenHeader title="Wallet" backTo="/app/earnings" />

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[1.65rem] border border-white/15 bg-linear-to-br from-blue-900 via-slate-900 to-slate-950 p-5 text-white shadow-[0_22px_48px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
              <Wallet className="h-3.5 w-3.5" aria-hidden /> Wallet balance
            </p>
            <p className={`mt-1 font-mono text-3xl font-black tracking-tight ${negative ? 'text-rose-300' : 'text-white'}`}>
              {formatRupees(summary.balance)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusChip.cls}`}>
            {statusChip.text}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <BucketTile label="Withdrawable" value={summary.withdrawable} tone="emerald" />
          <BucketTile label="Recharge" value={summary.rechargeBalance} />
          <BucketTile label="Dues" value={summary.outstandingDues} tone={summary.outstandingDues > 0 ? 'rose' : 'white'} />
        </div>
        {cfg.blockedByDues ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-100 ring-1 ring-rose-400/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            You owe {formatRupees(summary.outstandingDues)} — new jobs are paused until you recharge.
          </p>
        ) : null}
        <Link
          to="/app/earnings"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-200 hover:text-white"
        >
          Withdraw earnings <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </motion.section>

      <GlassPanel className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Recharge wallet</h2>
          <p className="mt-1 text-xs text-slate-500">
            Platform fees for cash jobs are deducted from your wallet. Recharges clear any dues first.
          </p>
        </div>
        {requested > 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            You need at least {formatRupees(requested)} more to accept that cash job.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmountInput(String(a))}
              className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                Number(amount) === a ? 'bg-brand text-white ring-brand' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand/40'
              }`}
            >
              ₹{a.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={minRecharge}
            max={maxRecharge}
            step="1"
            value={amount}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={`${minRecharge} – ${maxRecharge}`}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-8 pr-4 text-sm font-semibold outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          />
        </div>
        {notice ? (
          <p
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              notice.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {notice.type === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {notice.text}
          </p>
        ) : null}
        <button
          type="button"
          disabled={paying || !amountValid}
          onClick={handleRecharge}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand to-blue-800 px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-brand/25 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" aria-hidden />}
          {paying ? 'Processing…' : amountValid ? `Recharge ₹${numericAmount.toLocaleString('en-IN')}` : 'Recharge'}
        </button>
      </GlassPanel>

      <section>
        <AppSectionHeader title="How cash jobs work" className="mb-3 px-0.5" />
        <GlassPanel className="space-y-3 p-4">
          {[
            'Keep your wallet recharged — a cash job needs its platform fee in your wallet before you can accept it.',
            'Collect the full amount in cash from the customer when the job is done.',
            'Once the customer confirms they paid, the platform fee is deducted from your wallet automatically.',
            'Online job earnings, bonuses and referral rewards are added to your wallet and can be withdrawn.',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-extrabold text-brand ring-1 ring-brand/15">
                {i + 1}
              </span>
              <p className="pt-1 text-sm font-medium text-slate-700">{text}</p>
            </div>
          ))}
        </GlassPanel>
      </section>

      {bonuses.length > 0 ? (
        <section>
          <AppSectionHeader title="Bonuses" className="mb-3 px-0.5" />
          <ul className="space-y-2">
            {bonuses.map((b) => (
              <li key={b._id}>
                <GlassPanel className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <Gift className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      {BONUS_TYPE_LABELS[b.bonusType] || 'Bonus'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">{b.reason}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {b.bonusCode} · {formatDateTime(b.createdAt)}
                    </p>
                    {b.status === 'REVERSED' && b.reversalReason ? (
                      <p className="mt-1 text-[11px] font-medium text-rose-700">Reversed: {b.reversalReason}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`font-mono text-sm font-black ${b.status === 'REVERSED' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                      +{formatRupees(b.amount)}
                    </span>
                    {b.status === 'REVERSED' ? <AppBadge variant="rose">Reversed</AppBadge> : null}
                  </div>
                </GlassPanel>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <AppSectionHeader title="Wallet activity" className="mb-3 px-0.5" />
        {ledger.items.length === 0 ? (
          <GlassPanel className="p-6 text-center text-sm font-medium text-slate-500">No wallet activity yet.</GlassPanel>
        ) : (
          <GlassPanel className="divide-y divide-slate-100 p-0">
            {ledger.items.map((t) => {
              const Icon = CONTEXT_ICONS[t.context] || Wallet
              const credit = t.type === 'CREDIT'
              return (
                <div key={t._id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      credit ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80' : 'bg-rose-50 text-rose-700 ring-rose-200/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{WALLET_CONTEXT_LABELS[t.context] || t.context}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {formatDateTime(t.createdAt)}
                      {t.description ? ` · ${t.description}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-sm font-black ${credit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {credit ? '+' : '−'}
                      {formatRupees(t.amount)}
                    </p>
                    {typeof t.balanceAfter === 'number' ? (
                      <p className="text-[10px] font-medium text-slate-400">Bal {formatRupees(t.balanceAfter)}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </GlassPanel>
        )}
        {ledger.page < ledger.pages ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Show more'}
          </button>
        ) : null}
      </section>
    </div>
  )
}
