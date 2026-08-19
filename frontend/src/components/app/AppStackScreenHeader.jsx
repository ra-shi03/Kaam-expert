import { Link } from 'react-router-dom'
import { ArrowLeft, Menu } from 'lucide-react'

function openAppDrawer() {
  window.dispatchEvent(new Event('lc-open-app-drawer'))
}

/**
 * Standard header for full-screen app routes without AppShell chrome (bookings, search, etc.).
 */
export function AppStackScreenHeader({ title, backTo = '/app', onBack, className = '' }) {
  return (
    <header className={`mt-[max(0.75rem,env(safe-area-inset-top))] mb-4 flex items-center justify-between gap-3 rounded-[2.5rem] border border-slate-200 bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md sticky top-[max(0.75rem,env(safe-area-inset-top))] z-40 ${className}`}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 transition active:scale-95 active:bg-slate-50"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <Link
          to={backTo}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 transition active:scale-95 active:bg-slate-50"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 text-center text-[17px] font-bold text-slate-900 tracking-tight">{title}</h1>
      <button
        type="button"
        onClick={openAppDrawer}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 transition active:scale-95 active:bg-slate-50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>
    </header>
  )
}
