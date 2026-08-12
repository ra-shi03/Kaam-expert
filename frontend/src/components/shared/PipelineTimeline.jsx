import { AppSurface } from '../app-ui/cards/AppSurface.jsx'

const STATUS_LABELS = {
  pending_review: 'Submitted',
  broadcasted: 'Submitted',
  confirmed: 'Confirmed',
  allocating: 'Allocating',
  assigned: 'Assigned',
  in_progress: 'On site',
  attendance_tracking: 'Attendance',
  billing: 'Billing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

export function PipelineTimeline({ status, title = 'Status', compact = false }) {
  const steps = ['pending_review', 'confirmed', 'allocating', 'assigned', 'in_progress', 'attendance_tracking', 'billing', 'completed']
  const normalizedStatus = status === 'broadcasted' ? 'pending_review' : status
  const idx = steps.indexOf(normalizedStatus)
  return (
    <AppSurface className={`border-slate-200/90 ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-bold text-slate-900">{STATUS_LABELS[status] || status}</p>
      <div className="mt-3 flex gap-1">
        {steps.slice(0, 6).map((s, i) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-brand' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </AppSurface>
  )
}

