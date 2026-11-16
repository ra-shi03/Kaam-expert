import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  Gift,
  HardHat,
  IdCard,
  MessageSquareWarning,
  Star,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel.jsx'

const TYPE_STYLE = {
  booking_received: { icon: Zap, tone: 'bg-amber-50 text-amber-600 ring-amber-200' },
  booking_accepted: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  booking_assigned: { icon: HardHat, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  booking_failed: { icon: XCircle, tone: 'bg-rose-50 text-rose-600 ring-rose-200' },
  booking_scheduled: { icon: CalendarClock, tone: 'bg-blue-50 text-blue-600 ring-blue-200' },
  booking_update: { icon: Bell, tone: 'bg-blue-50 text-blue-600 ring-blue-200' },
  booking_updated: { icon: Bell, tone: 'bg-blue-50 text-blue-600 ring-blue-200' },
  job_reminder: { icon: CalendarClock, tone: 'bg-amber-50 text-amber-600 ring-amber-200' },
  payment_due: { icon: BadgeIndianRupee, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  kyc_status: { icon: IdCard, tone: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
  wallet_recharge_required: { icon: Wallet, tone: 'bg-amber-50 text-amber-600 ring-amber-200' },
  cash_fee_deducted: { icon: Wallet, tone: 'bg-slate-100 text-slate-600 ring-slate-200' },
  withdrawal_status: { icon: BadgeIndianRupee, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  bonus_credited: { icon: Gift, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  bonus_reversed: { icon: Gift, tone: 'bg-rose-50 text-rose-600 ring-rose-200' },
  referral_reward: { icon: Gift, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  complaint_update: { icon: MessageSquareWarning, tone: 'bg-blue-50 text-blue-600 ring-blue-200' },
  review_received: { icon: Star, tone: 'bg-amber-50 text-amber-600 ring-amber-200' },
}
const DEFAULT_STYLE = { icon: Bell, tone: 'bg-slate-100 text-slate-600 ring-slate-200' }

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Yesterday' : `${d} days ago`
}

/** List of server notifications; tapping one marks it read and opens its screen. */
export function NotificationList({ items, onRead }) {
  const navigate = useNavigate()

  return (
    <ul className="space-y-2.5">
      {items.map((n) => {
        const { icon: Icon, tone } = TYPE_STYLE[n.type] || DEFAULT_STYLE
        const unread = !n.readAt
        return (
          <li key={n._id}>
            <button
              type="button"
              onClick={() => {
                if (unread) onRead?.(n._id)
                if (n.url) navigate(n.url)
              }}
              className="block w-full text-left"
            >
              <GlassPanel className={`relative flex gap-3 p-3.5 transition active:scale-[0.99] ${unread ? 'border-brand/30 bg-white shadow-md shadow-brand/5' : 'border-slate-200/90'}`}>
                {unread ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-brand" aria-label="Unread" /> : null}
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 pr-4">
                  <span className="block text-sm font-extrabold text-slate-900">{n.title}</span>
                  {n.body ? <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">{n.body}</span> : null}
                  <span className="mt-1 block text-[11px] font-semibold text-slate-400">{timeAgo(n.createdAt)}</span>
                </span>
              </GlassPanel>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
