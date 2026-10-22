export function BonusStatusPill({ status }) {
  const reversed = status === 'REVERSED'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
        reversed ? 'bg-rose-50 text-rose-700 ring-rose-200/80' : 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
      }`}
    >
      {reversed ? 'Reversed' : 'Credited'}
    </span>
  )
}
