import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Layers,
  Shield,
  Users,
  Loader2,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  HandCoins,
  IndianRupee,
  MessageSquare,
  Percent,
  Receipt,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { ADMIN_NAV_SECTIONS } from '../../config/adminNavigation.js'
import { apiRequest } from '../../api/http.js'

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export function AdminDashboardPage() {
  const reduce = useReducedMotion()
  
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiRequest('/admin/dashboard/stats')
        setStats(res.data)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const flatLinks = ADMIN_NAV_SECTIONS.flatMap((s) =>
    s.items.filter((i) => i.to !== '/admin').map((i) => ({ ...i, section: s.title })),
  ).slice(0, 6)

  const QUICK_STATS = [
    { 
      label: 'Active bookings', 
      value: stats?.bookings?.active ?? '—', 
      hint: 'Currently in progress', 
      icon: ClipboardList, 
      iconColor: 'text-amber-600',
      accent: 'bg-amber-200/40',
      to: '/admin/bookings',
    },
    { 
      label: 'Workers on roster', 
      value: stats?.users?.labourers ?? '—', 
      hint: 'Registered workforce', 
      icon: Users, 
      iconColor: 'text-emerald-600',
      accent: 'bg-emerald-200/40',
      to: '/admin/users',
    },
    { 
      label: 'Contractor accounts', 
      value: stats?.users?.contractors ?? '—', 
      hint: 'B2B Partners', 
      icon: Shield, 
      iconColor: 'text-purple-600',
      accent: 'bg-purple-200/40',
      to: '/admin/users',
    },
    { 
      label: 'Skill categories', 
      value: stats?.system?.categories ?? '—', 
      hint: 'Platform managed', 
      icon: Layers, 
      iconColor: 'text-blue-600',
      accent: 'bg-blue-200/40',
      to: '/admin/categories',
    },
    {
      label: 'Total customers',
      value: stats?.users?.customers ?? '—',
      hint: 'Registered customers',
      icon: UserCheck,
      iconColor: 'text-rose-600',
      accent: 'bg-rose-200/40',
      to: '/admin/users',
    },
    {
      label: 'Total bookings',
      value: stats?.bookings?.total ?? '—',
      hint: 'All time',
      icon: CalendarDays,
      iconColor: 'text-indigo-600',
      accent: 'bg-indigo-200/40',
      to: '/admin/bookings',
    },
    {
      label: 'Completed bookings',
      value: stats?.bookings?.completed ?? '—',
      hint: 'Successfully finished',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      accent: 'bg-green-200/40',
      to: '/admin/bookings',
    },
    {
      label: 'Gross volume',
      value: inr(stats?.revenue?.grossTransactionVolume),
      hint: 'Completed bookings, all time',
      icon: IndianRupee,
      iconColor: 'text-teal-600',
      accent: 'bg-teal-200/40',
      to: '/admin/billing',
    },
    {
      label: 'Platform earnings',
      value: inr(stats?.revenue?.platformEarnings),
      hint: 'Platform fees collected',
      icon: Wallet,
      iconColor: 'text-cyan-600',
      accent: 'bg-cyan-200/40',
      to: '/admin/platform-fee',
    },
    {
      label: 'Commissions',
      value: inr(stats?.revenue?.commissionsCollected),
      hint: 'Commission collected',
      icon: Percent,
      iconColor: 'text-sky-600',
      accent: 'bg-sky-200/40',
      to: '/admin/commission-fee',
    },
    {
      label: 'Taxes collected',
      value: inr(stats?.revenue?.taxesCollected),
      hint: 'Taxes on completed bookings',
      icon: Receipt,
      iconColor: 'text-orange-600',
      accent: 'bg-orange-200/40',
      to: '/admin/billing',
    },
    {
      label: 'Open complaints',
      value: stats?.actionable?.openComplaints ?? '—',
      hint: 'Awaiting resolution',
      icon: MessageSquare,
      iconColor: 'text-red-600',
      accent: 'bg-red-200/40',
      to: '/admin/complaints',
    },
    {
      label: 'Pending withdrawals',
      value: stats?.actionable?.pendingWithdrawals ?? '—',
      hint: 'Waiting for approval',
      icon: HandCoins,
      iconColor: 'text-amber-600',
      accent: 'bg-amber-200/40',
      to: '/admin/labour-wallet',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Control centre</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
          Super panel for KaamExpert — users, workforce, bookings, allocation, attendance, billing, and analytics per
          your Work Scope. Use the sidebar to jump into each module.
        </p>
      </motion.div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
             <GlassPanel key={i} className="h-28 flex items-center justify-center p-5 bg-slate-50/50 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
             </GlassPanel>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
            >
              <Link
                to={s.to}
                className="group relative block h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
              >
                <div className={`absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-60 ${s.accent}`} />
                <div className="relative z-10 flex items-center justify-between gap-2 px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{s.label}</p>
                    <p className="mb-1 text-xl font-bold leading-tight tabular-nums text-neutral-900">{s.value}</p>
                    <p className="line-clamp-1 text-[10px] font-medium text-neutral-500">{s.hint}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm ring-1 ring-neutral-200 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
                    <s.icon className={`h-5 w-5 ${s.iconColor}`} aria-hidden />
                  </span>
                </div>
                <ArrowUpRight className="absolute bottom-2 right-2 h-3 w-3 translate-x-2 text-neutral-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassPanel className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Shortcuts</h2>
            <BarChart3 className="h-5 w-5 text-slate-300" aria-hidden />
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {flatLinks.map(({ to, label, icon: Icon, section }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex items-center justify-between gap-3 py-3.5 transition hover:bg-slate-50/80"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand ring-1 ring-brand/15">
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{label}</span>
                      {section ? <span className="text-xs text-slate-500">{section}</span> : null}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="h-fit p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Action Required</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              There are currently <span className="font-bold text-brand">{stats?.actionable?.openComplaints || 0}</span> open complaints and <span className="font-bold text-brand">{stats?.actionable?.pendingWithdrawals || 0}</span> pending withdrawal requests.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <Link
                to="/admin/complaints"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
              >
                View complaints
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/admin/labour-wallet"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
              >
                View withdrawal requests
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </GlassPanel>

          <GlassPanel className="h-fit p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Today</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Operational queues (contractor approvals, KYC, FCFS bookings) will surface here.
            </p>
            <Link
              to="/admin/labour"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
            >
              Open workforce requests
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
