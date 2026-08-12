import { Link } from 'react-router-dom'
import { ArrowLeft, Menu } from 'lucide-react'

function openAppDrawer() {
  window.dispatchEvent(new Event('lc-open-app-drawer'))
}

/**
 * Standard header for full-screen app routes without AppShell chrome (bookings, search, etc.).
 */
export function AppStackScreenHeader({ title, backTo = '/app', onBack }) {
  return (
    <header className="-mx-4 flex items-center gap-2 border-b border-slate-200 bg-white px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 active:bg-slate-50"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
      ) : (
        <Link
          to={backTo}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 active:bg-slate-50"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 text-lg font-extrabold text-slate-900">{title}</h1>
      <button
        type="button"
        onClick={openAppDrawer}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:bg-slate-50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
    </header>
  )
}
