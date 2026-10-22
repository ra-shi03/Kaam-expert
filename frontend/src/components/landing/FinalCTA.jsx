import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Clock3, PhoneCall } from 'lucide-react'
import { SITE } from '../../data/landingContent'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'

export function FinalCTA() {
  const reduce = useReducedMotion()

  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-slate-200/80 bg-white py-16 sm:py-20"
      aria-labelledby="cta-heading"
    >
      <div className="lp-drift pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="lp-drift-reverse pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-brand-muted/80 blur-3xl" />

      <Container className="relative">
        <motion.div
          className="rounded-[1.75rem] border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/30 transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/10 sm:rounded-[2rem] sm:p-8 md:p-12"
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4 text-slate-900">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-3 py-1 text-xs font-semibold text-slate-800">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                <Clock3 className="h-3.5 w-3.5 text-brand" aria-hidden />
                Same-day & emergency slots in select cities
              </div>
              <h2 id="cta-heading" className="text-[1.75rem] font-extrabold tracking-tight text-balance sm:text-3xl md:text-4xl">
                Need labour urgently?
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
                Post your requirement once—we match verified workers, share live status, and keep
                payouts documented. Scaling contractors can talk to our team for custom SLAs.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href={`tel:${SITE.phone.replace(/\s/g, '')}`} variant="secondary">
                  <PhoneCall className="h-4 w-4" aria-hidden />
                  Talk to us
                </ButtonLink>
                <p className="text-xs text-slate-500">
                  Prefer human help? {SITE.phone} · {SITE.contactEmail}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href="#services-pricing" variant="primary" className="!py-4 !text-base shadow-lg shadow-brand/25">
                Book Verified Labour
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/labours/auth" variant="secondary" className="!py-4 !text-base">
                Become a Labour Partner
              </ButtonLink>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
