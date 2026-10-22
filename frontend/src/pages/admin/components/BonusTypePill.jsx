import { Award, Gift, ShieldCheck, Tag, Zap } from 'lucide-react'

export const BONUS_TYPE_CONFIG = {
  performance: {
    value: 'performance',
    label: 'Performance bonus',
    badge: 'Performance',
    desc: 'Top ratings, fast job completion, or exceptional work',
    icon: Award,
    iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-200/80',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  },
  incentive: {
    value: 'incentive',
    label: 'Incentive bonus',
    badge: 'Incentive',
    desc: 'Target milestones, peak rush hours, or volume rewards',
    icon: Zap,
    iconBg: 'bg-amber-50 text-amber-600 ring-amber-200/80',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-200/80',
  },
  festival: {
    value: 'festival',
    label: 'Festival / special bonus',
    badge: 'Festival',
    desc: 'Diwali, Eid, New Year, or festive celebrations',
    icon: Gift,
    iconBg: 'bg-rose-50 text-rose-600 ring-rose-200/80',
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200/80',
  },
  compensation: {
    value: 'compensation',
    label: 'Compensation / goodwill',
    badge: 'Goodwill',
    desc: 'Cancelled trips, dispute resolution, or courtesy credits',
    icon: ShieldCheck,
    iconBg: 'bg-sky-50 text-sky-600 ring-sky-200/80',
    badgeClass: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  },
  other: {
    value: 'other',
    label: 'Other',
    badge: 'Discretionary',
    desc: 'Custom discretionary or administrative wallet credit',
    icon: Tag,
    iconBg: 'bg-violet-50 text-violet-600 ring-violet-200/80',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-200/80',
  },
}

export function BonusTypePill({ type }) {
  const conf = BONUS_TYPE_CONFIG[type]
  if (!conf) {
    return <span className="text-xs font-semibold text-slate-700">{type || '—'}</span>
  }
  const Icon = conf.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ${conf.badgeClass}`}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{conf.label}</span>
    </span>
  )
}

