import { CheckCircle2, FileText, MapPin } from 'lucide-react'
import { AppButton } from '../../app-ui/buttons/AppButton.jsx'
import { AppPrimaryButton } from '../../app/AppPrimaryButton.jsx'

const STEPS = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_site', label: 'On site' },
  { key: 'done', label: 'Done' },
]

function stepIndex(status) {
  if (status === 'on_site') return 1
  return 0
}

export function LabourJobActiveCard({ job, onMarkOnSite, onOpenDetail, onComplete }) {
  const status = job.status || 'accepted'
  const onSite = status === 'on_site'
  const idx = stepIndex(status)

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-blue-200/80 bg-linear-to-br from-blue-50/80 via-white to-white shadow-[0_10px_36px_-20px_rgba(16,185,129,0.35)] ring-1 ring-blue-100">
      <div className="border-b border-blue-100/80 bg-blue-600/10 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-blue-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden />
            Live deployment
          </span>
          {job.requestRef ? (
            <span className="font-mono text-[10px] font-bold text-blue-700/90">{job.requestRef}</span>
          ) : null}
        </div>
        <h3 className="mt-2 text-[15px] font-extrabold leading-snug text-slate-900">{job.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-slate-600">{job.site}</p>
        <p className="mt-1 text-xs text-slate-500">{job.shiftWindow}</p>
      </div>

      <div className="flex items-center gap-1 px-4 py-3">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-1">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                i <= idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-[10px] font-bold ${i <= idx ? 'text-blue-800' : 'text-slate-400'}`}>{s.label}</span>
            {i < STEPS.length - 1 ? <span className="mx-0.5 h-px flex-1 bg-slate-200" aria-hidden /> : null}
          </div>
        ))}
      </div>

      <div className="space-y-2 px-4 pb-4">
        {!onSite ? (
          <AppPrimaryButton type="button" className="w-full py-3 text-sm" onClick={() => onMarkOnSite(job.id)}>
            <MapPin className="h-4 w-4" aria-hidden />
            Mark check-in on site
          </AppPrimaryButton>
        ) : (
          <p className="rounded-xl bg-blue-100/80 px-3 py-2 text-center text-xs font-semibold text-blue-900">
            Checked in — attendance is being tracked
          </p>
        )}
        <AppButton type="button" variant="secondary" className="w-full py-2.5 text-xs" onClick={() => onOpenDetail(job)}>
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Site brief & attendance
        </AppButton>
        <AppPrimaryButton
          type="button"
          className="w-full border border-blue-200/90 bg-white py-2.5 text-xs text-blue-900 shadow-sm hover:bg-blue-50"
          onClick={() => onComplete(job.id)}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Complete shift
        </AppPrimaryButton>
      </div>
    </article>
  )
}
