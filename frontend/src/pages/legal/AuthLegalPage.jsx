import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUp, CalendarDays, FileText, ShieldCheck } from 'lucide-react'
import { useBranding } from '../../context/BrandingContext.jsx'
import { useLegalContent } from '../../hooks/useLegalContent.js'
import { AUDIENCES } from '../../lib/legalContent.js'
import { LegalDocument } from '../../components/legal/LegalDocument.jsx'

const META = {
  privacy: {
    icon: ShieldCheck,
    title: 'Privacy Policy',
    blurb: {
      users: 'How we collect, use and protect your personal information.',
      labours: 'How we handle your KYC, location and earnings data as a partner.',
    },
  },
  terms: {
    icon: FileText,
    title: 'Terms & Conditions',
    blurb: {
      users: 'The terms and rules for booking services on KaamExpert.',
      labours: 'The rules for accepting jobs, earnings and payouts on KaamExpert.',
    },
  },
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Dedicated, mobile-optimized separate page for Terms & Conditions and Privacy Policy.
 * Designed specifically for users coming from the registration / login flow so they
 * can read terms and cleanly return to authentication without being redirected to the landing website.
 */
export function AuthLegalPage({ audience = 'users', type = 'terms' }) {
  const navigate = useNavigate()
  const { logoUrl } = useBranding()
  const info = AUDIENCES[audience] || AUDIENCES.users
  const meta = META[type] || META.terms
  const Icon = meta.icon
  const { content, updatedAt, loading, error, company } = useLegalContent(type, info.role)
  const [showTop, setShowTop] = useState(false)
  const updated = formatDate(updatedAt)

  useEffect(() => {
    document.title = `${meta.title} · ${company.brandName}`
  }, [meta.title, company.brandName])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleBack = () => {
    // Check if there is valid browser history to go back to
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      // Fallback: return to auth page, NEVER to website landing page
      navigate(info.authPath || `/${audience}/auth`, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {logoUrl ? <img src={logoUrl} alt="" className="h-6 w-auto" /> : null}
            <span className="truncate text-sm font-black text-brand tracking-tight">{meta.title}</span>
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {info.short}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8 pb-28">
        <div className="mb-6 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{meta.title}</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {meta.blurb[audience] || meta.blurb.users}
              </p>
            </div>
          </div>
          {updated ? (
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              <span>Last updated: {updated}</span>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-white border border-slate-200/80 p-8 shadow-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand/20 border-t-brand" />
              <p className="text-xs font-medium text-slate-500">Loading document…</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <LegalDocument content={content} company={company} />
          </div>
        )}
      </main>

      {/* Floating Bottom Bar for Quick Return */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 p-3.5 backdrop-blur-md shadow-lg"
        data-hide-on-keyboard="true"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Finished reading {meta.title}?
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Sign Up</span>
          </button>
        </div>
      </div>

      {showTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-20 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:scale-105 active:scale-95"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
