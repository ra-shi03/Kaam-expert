import { AppSurface } from '../app-ui/cards/AppSurface.jsx'

export function OpsStatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClass =
    tone === 'brand'
      ? 'border-brand/25 bg-brand/5'
      : tone === 'warn'
        ? 'border-amber-200/90 bg-amber-50/40'
        : 'border-slate-200/90'
  return (
    <AppSurface className={`${toneClass} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
        </div>
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-slate-200/80">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        ) : null}
      </div>
    </AppSurface>
  )
}
