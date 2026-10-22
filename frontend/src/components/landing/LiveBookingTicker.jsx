import { CheckCircle2, Clock, ShieldCheck, Sparkles, Zap } from 'lucide-react'

const TICKER_ITEMS = [
  {
    icon: Zap,
    text: 'Brick Masonry booked in Indore Zone',
    time: '5m ago',
    badge: 'Dispatched',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  },
  {
    icon: ShieldCheck,
    text: '100% Aadhaar Verified & Background Checked',
    time: 'Guaranteed',
    badge: 'Trust',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-200/80',
  },
  {
    icon: Clock,
    text: 'Pipe Leakage Repair dispatched in Bhopal Zone',
    time: '14m ago',
    badge: 'Active Job',
    badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  },
  {
    icon: Sparkles,
    text: 'Wiring Repair completed in Ujjain Zone · 5.0 ★',
    time: '26m ago',
    badge: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  },
  {
    icon: CheckCircle2,
    text: 'Instant UPI/Card Payments & Transparent Slabs',
    time: 'Escrow Protected',
    badge: 'Safe Pay',
    badgeClass: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  },
  {
    icon: Zap,
    text: 'AC General Service scheduled in Indore Zone',
    time: '38m ago',
    badge: 'Scheduled',
    badgeClass: 'bg-indigo-50 text-indigo-700 ring-indigo-200/80',
  },
  {
    icon: Clock,
    text: 'Moving & Shifting Helper dispatched in Jaipur',
    time: '45m ago',
    badge: 'On the way',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  },
  {
    icon: Sparkles,
    text: 'Daily Home Cook service confirmed in Raisen Zone',
    time: '52m ago',
    badge: 'Confirmed',
    badgeClass: 'bg-purple-50 text-purple-700 ring-purple-200/80',
  },
]

export function LiveBookingTicker() {
  return (
    <div
      className="lp-marquee-wrap relative overflow-hidden border-y border-slate-200/80 bg-white/80 py-3 backdrop-blur-md"
      aria-label="Recent bookings across KaamExpert"
    >
      {/* Soft gradient masks for edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />

      <div className="flex w-max">
        <div className="lp-marquee flex items-center gap-4 pr-4 sm:gap-6 sm:pr-6">
          {/* Double array for seamless infinite loop */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                aria-hidden={index >= TICKER_ITEMS.length ? true : undefined}
                className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md hover:shadow-brand/5 sm:gap-3 sm:px-3.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="h-3 w-3" aria-hidden />
                </span>
                <span className="whitespace-nowrap font-semibold text-slate-800">{item.text}</span>
                <span className="text-slate-400" aria-hidden>·</span>
                <span className="whitespace-nowrap font-mono text-[11px] text-slate-500">{item.time}</span>
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${item.badgeClass}`}>
                  {item.badge}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
