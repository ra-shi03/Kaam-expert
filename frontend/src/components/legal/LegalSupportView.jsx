import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Building2, ChevronDown, Clock, LifeBuoy, Mail, MapPin, MessageSquareWarning, Phone, Search } from 'lucide-react'
import { formatPhone, parseLegalContent, telHref } from '../../lib/legalContent.js'
import { Blocks } from './LegalRichText.jsx'

function ContactCard({ icon: Icon, tone, title, value, hint, href }) {
  const Wrapper = href ? 'a' : 'div'
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_40px_-20px_rgba(37,99,235,0.35)]"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <p className="mt-1 break-words text-base font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{hint}</p>
    </Wrapper>
  )
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition ${open ? 'border-brand/30 shadow-md' : 'border-slate-200/80'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[15px] font-bold leading-snug text-slate-900">{item.title}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${open ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-t border-slate-100 px-5 pb-5 pt-3"><Blocks blocks={item.blocks} /></div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function LegalSupportView({ content, company, audienceInfo }) {
  const reduce = useReducedMotion()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const sections = useMemo(() => parseLegalContent(content, company), [content, company])
  const intro = sections.find((s) => !s.title)
  const faqs = useMemo(() => sections.filter((s) => s.title), [sections])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return faqs
    return faqs.filter((f) => `${f.title} ${f.blocks.map((b) => b.text ?? b.items?.join(' ') ?? '').join(' ')}`.toLowerCase().includes(q))
  }, [faqs, query])

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <ContactCard
          icon={Phone}
          tone="bg-sky-50 text-sky-600"
          title="Customer care"
          value={formatPhone(company.phone)}
          hint={`Tap to call · ${company.supportHours}`}
          href={telHref(company.phone)}
        />
        <ContactCard
          icon={Mail}
          tone="bg-violet-50 text-violet-600"
          title="Email us"
          value={company.email}
          hint="We usually reply within one working day"
          href={`mailto:${company.email}`}
        />
        <ContactCard
          icon={MapPin}
          tone="bg-emerald-50 text-emerald-600"
          title="Registered office"
          value={company.address}
          hint={`CIN: ${company.cin}`}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`}
        />
      </div>

      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-linear-to-r from-slate-900 via-slate-900 to-brand p-6 text-white sm:flex-row sm:items-center sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <MessageSquareWarning className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-extrabold">Have an issue with a booking?</p>
            <p className="mt-1 text-sm text-white/75">Log in and raise a complaint. Our team tracks it until it is resolved.</p>
          </div>
        </div>
        <Link
          to={audienceInfo.authPath}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:scale-[1.03] active:scale-[0.98]"
        >
          Log in to raise a complaint <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
              <LifeBuoy className="h-6 w-6 text-brand" aria-hidden /> Help &amp; frequently asked questions
            </h2>
            {intro ? <div className="mt-2 max-w-2xl"><Blocks blocks={intro.blocks} /></div> : (
              <p className="mt-1 text-sm font-medium text-slate-500">Quick answers for {audienceInfo.label.toLowerCase()}.</p>
            )}
          </div>
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for help…"
              aria-label="Search help articles"
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium shadow-sm outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {shown.length ? (
            shown.map((item, i) => (
              <motion.div key={item.id} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <FaqItem item={item} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />
              </motion.div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-bold text-slate-700">No answers match “{query}”.</p>
              <p className="mt-1 text-xs text-slate-500">Try different words or contact us using the details above.</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-sm text-slate-600">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <p>
          <span className="font-bold text-slate-900">{company.legalName}</span> · CIN {company.cin} · {company.address}.
          <span className="mt-1 flex items-center gap-1.5 text-slate-500"><Clock className="h-3.5 w-3.5" aria-hidden /> {company.supportHours}</span>
        </p>
      </div>
    </div>
  )
}
