import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowUp, CalendarDays, HardHat, Headphones, Mail, MapPin, Phone, ShieldCheck, FileText, Users } from 'lucide-react'
import { useBranding } from '../../context/BrandingContext.jsx'
import { useLegalContent } from '../../hooks/useLegalContent.js'
import { AUDIENCES, LEGAL_PAGES, formatPhone, legalPath, telHref } from '../../lib/legalContent.js'
import { LegalDocument } from '../../components/legal/LegalDocument.jsx'
import { LegalSupportView } from '../../components/legal/LegalSupportView.jsx'

const PAGE_META = {
  privacy: {
    icon: ShieldCheck,
    title: 'Privacy Policy',
    blurb: {
      users: 'How we collect, use and protect your information when you book services on Kaam Expert.',
      labours: 'How we handle your KYC, location and earnings data as a Kaam Expert labour partner.',
    },
  },
  terms: {
    icon: FileText,
    title: 'Terms & Conditions',
    blurb: {
      users: 'The rules for booking, paying for and cancelling services on Kaam Expert.',
      labours: 'The rules for accepting jobs, earning and getting paid as a Kaam Expert labour partner.',
    },
  },
  support: {
    icon: Headphones,
    title: 'Help & Support',
    blurb: {
      users: 'Talk to our team or find quick answers about bookings, payments and safety.',
      labours: 'Get help with KYC, jobs, wallet recharges and payouts.',
    },
  },
}

function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setPct(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent" aria-hidden>
      <div className="h-full bg-linear-to-r from-brand to-sky-400 transition-[width] duration-100" style={{ width: `${pct}%` }} />
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-3xl border border-slate-200/80 bg-white p-7">
          <div className="h-5 w-1/3 rounded-full bg-slate-200" />
          <div className="mt-5 space-y-2.5">
            <div className="h-3 rounded-full bg-slate-100" />
            <div className="h-3 w-11/12 rounded-full bg-slate-100" />
            <div className="h-3 w-4/5 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LegalPublicPage({ audience, type }) {
  const reduce = useReducedMotion()
  const { logoUrl } = useBranding()
  const info = AUDIENCES[audience]
  const meta = PAGE_META[type]
  const { content, updatedAt, loading, error, company } = useLegalContent(type, info?.role)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    document.title = info && meta ? `${meta.title} · ${company.brandName} ${info.short}` : company.brandName
  }, [info, meta, company.brandName])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (loading || !window.location.hash) return
    const id = decodeURIComponent(window.location.hash.slice(1))
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
  }, [loading])

  if (!info || !meta) return <Navigate to="/" replace />

  const Icon = meta.icon
  const otherAudience = audience === 'users' ? 'labours' : 'users'
  const updated = formatDate(updatedAt)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ReadingProgress />

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${company.brandName} home`}>
            <img src={logoUrl} alt="" className="h-8 w-auto" />
            <span className="truncate text-base font-extrabold tracking-tight">{company.brandName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={legalPath(otherAudience, type)}
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-brand/30 hover:text-brand sm:inline-flex"
            >
              {otherAudience === 'labours' ? <HardHat className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              Switch to {AUDIENCES[otherAudience].short}
            </Link>
            <Link
              to={info.authPath}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-brand text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/40 blur-3xl" />
          <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ring-1 ring-white/20">
            {audience === 'labours' ? <HardHat className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
            For {info.label}
          </span>
          <div className="mt-5 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon className="h-7 w-7" aria-hidden />
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{meta.title}</h1>
          </div>
          <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/75 sm:text-lg">{meta.blurb[audience]}</p>
          {type !== 'support' && updated ? (
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/70">
              <CalendarDays className="h-4 w-4" aria-hidden /> Last updated {updated}
            </p>
          ) : null}
        </motion.div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
        <nav aria-label="Legal pages" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-lg shadow-slate-900/5">
          {LEGAL_PAGES.map((p) => {
            const active = p.type === type
            return (
              <Link
                key={p.type}
                to={legalPath(audience, p.type)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${
                  active ? 'text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {active ? (
                  <motion.span layoutId={`legal-tab-${audience}`} className="absolute inset-0 rounded-xl bg-brand shadow-md shadow-brand/30" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                ) : null}
                <span className="relative">{PAGE_META[p.type].title.replace('Help & ', '')}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-semibold text-rose-700">{error}</div>
        ) : type === 'support' ? (
          <LegalSupportView content={content} company={company} audienceInfo={info} />
        ) : (
          <LegalDocument content={content} company={company} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={logoUrl} alt="" className="h-8 w-auto" />
              <span className="text-base font-extrabold">{company.brandName}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">{company.legalName}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">CIN: {company.cin}</p>
          </div>
          <div className="space-y-2.5 text-sm text-slate-600">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Contact</p>
            <a href={telHref(company.phone)} className="flex items-center gap-2 font-medium transition hover:text-brand"><Phone className="h-4 w-4 text-slate-400" /> {formatPhone(company.phone)}</a>
            <a href={`mailto:${company.email}`} className="flex items-center gap-2 break-all font-medium transition hover:text-brand"><Mail className="h-4 w-4 shrink-0 text-slate-400" /> {company.email}</a>
            <p className="flex items-start gap-2 font-medium"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {company.address}</p>
          </div>
          <div className="space-y-2.5 text-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Legal</p>
            {LEGAL_PAGES.map((p) => (
              <Link key={p.type} to={legalPath(audience, p.type)} className="block font-medium text-slate-600 transition hover:text-brand">{PAGE_META[p.type].title}</Link>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} {company.legalName}. All rights reserved.
        </div>
      </footer>

      {showTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-6 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 transition hover:scale-105 active:scale-95"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  )
}
