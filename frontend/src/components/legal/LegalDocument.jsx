import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, Link2, List } from 'lucide-react'
import { parseLegalContent } from '../../lib/legalContent.js'
import { Blocks } from './LegalRichText.jsx'

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] ?? '')
  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === 'undefined') return undefined
    const visible = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null)
        const open = ids.filter((id) => visible.get(id) != null)
        if (open.length) setActive(open.sort((a, b) => visible.get(a) - visible.get(b))[0])
      },
      { rootMargin: '-90px 0px -60% 0px', threshold: 0 },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

function jumpTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

function TocList({ sections, active, onPick }) {
  return (
    <ol className="space-y-0.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onPick(s.id)}
            className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition ${
              active === s.id ? 'bg-brand/10 text-brand' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className={`mt-px w-5 shrink-0 text-[11px] font-bold tabular-nums ${active === s.id ? 'text-brand' : 'text-slate-300'}`}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 leading-snug">{s.title}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

function SectionCard({ section, index, reduce }) {
  const [copied, setCopied] = useState(false)
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${section.id}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }).catch(() => {})
  }
  return (
    <motion.section
      id={section.id}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="group scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)] sm:p-7"
    >
      {section.title ? (
        <div className="mb-4 flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-blue-500 text-[13px] font-extrabold text-white shadow-sm shadow-brand/30">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="min-w-0 flex-1 pt-1.5 text-lg font-extrabold leading-snug tracking-tight text-slate-900 sm:text-xl">{section.title}</h2>
          <button
            type="button"
            onClick={copyLink}
            aria-label={`Copy link to ${section.title}`}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-100 transition hover:bg-slate-100 hover:text-brand sm:opacity-0 sm:group-hover:opacity-100"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>
      ) : null}
      <Blocks blocks={section.blocks} />
    </motion.section>
  )
}

export function LegalDocument({ content, company }) {
  const reduce = useReducedMotion()
  const sections = useMemo(() => parseLegalContent(content, company), [content, company])
  const intro = sections.find((s) => !s.title)
  const titled = useMemo(() => sections.filter((s) => s.title), [sections])
  const ids = useMemo(() => titled.map((s) => s.id), [titled])
  const active = useActiveSection(ids)
  const [mobileOpen, setMobileOpen] = useState(false)

  const pick = (id) => {
    setMobileOpen(false)
    jumpTo(id)
  }

  if (!sections.length) {
    return <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">Content will be available here soon.</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm"
            aria-expanded={mobileOpen}
          >
            <span className="flex items-center gap-2"><List className="h-4 w-4 text-brand" /> On this page</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition ${mobileOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileOpen ? (
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
              <TocList sections={titled} active={active} onPick={pick} />
            </div>
          ) : null}
        </div>
        <div className="hidden max-h-[calc(100vh-8rem)] overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm lg:block">
          <p className="px-3 pb-2 pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">On this page</p>
          <TocList sections={titled} active={active} onPick={pick} />
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        {intro ? (
          <div className="rounded-3xl border border-brand/15 bg-linear-to-br from-brand/6 to-white p-5 sm:p-7">
            <Blocks blocks={intro.blocks} />
          </div>
        ) : null}
        {titled.map((section, i) => (
          <SectionCard key={section.id} section={section} index={i} reduce={reduce} />
        ))}
      </div>
    </div>
  )
}
