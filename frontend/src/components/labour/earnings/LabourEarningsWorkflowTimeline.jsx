import { CheckCircle2 } from 'lucide-react'
import { EARNINGS_WORKFLOW } from '../../../lib/labourEarningsFlow.js'

export function LabourEarningsWorkflowTimeline({ activeIndex = 0 }) {
  return (
    <ol className="space-y-0">
      {EARNINGS_WORKFLOW.map((step, i) => {
        const done = i < activeIndex
        const active = i === activeIndex

        return (
          <li key={step.id} className={`relative flex gap-3 ${i < EARNINGS_WORKFLOW.length - 1 ? 'pb-4' : ''}`}>
            {i < EARNINGS_WORKFLOW.length - 1 ? (
              <span
                className={`absolute left-[0.65rem] top-7 h-[calc(100%-0.5rem)] w-px ${done ? 'bg-blue-400/60' : 'bg-slate-200'}`}
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ${
                done
                  ? 'bg-blue-600 text-white ring-blue-200'
                  : active
                    ? 'bg-white text-blue-700 ring-blue-400 shadow-md'
                    : 'bg-slate-100 text-slate-400 ring-slate-200'
              }`}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <span className="text-[10px] font-black">{i + 1}</span>}
            </span>
            <div
              className={`min-w-0 flex-1 rounded-xl px-3 py-2 ring-1 ${
                active ? 'bg-blue-50 ring-blue-200/80' : done ? 'bg-white ring-slate-100' : 'bg-slate-50/80 ring-slate-100'
              }`}
            >
              <p className={`text-xs font-bold ${active ? 'text-blue-900' : 'text-slate-800'}`}>{step.label}</p>
              {active ? <p className="mt-0.5 text-[10px] font-medium text-blue-700">Current step</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
