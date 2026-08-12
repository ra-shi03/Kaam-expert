import { motion, useReducedMotion } from 'framer-motion'
import { services } from '../../data/landingContent'
import { LandingIcon } from '../../lib/iconMap'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

export function ServicesGrid() {
  const reduce = useReducedMotion()

  return (
    <section id="services" className="bg-white py-20 text-zinc-900" aria-labelledby="services-heading">
      <Container>
        <SectionHeading
          titleId="services-heading"
          eyebrow="Services"
          title="Every trade your site runs on—one roster"
          subtitle="From civil core to finishes and plant operations, book by role with clear starting prices and availability signals."
          align="center"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.04}>
              <motion.article
                className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm transition"
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -6,
                        boxShadow: '0 24px 60px -28px rgba(28, 175, 98, 0.28)',
                        borderColor: 'rgba(28, 175, 98, 0.4)',
                      }
                }
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-inner shadow-brand/20">
                    <LandingIcon name={s.icon} className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800 ring-1 ring-blue-200/80">
                    {s.availability}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{s.description}</p>
                <div className="mt-5 flex items-end justify-between border-t border-zinc-200/80 pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Starts around
                    </p>
                    <p className="text-xl font-extrabold text-zinc-900">
                      ₹{s.priceFrom}
                      <span className="text-sm font-semibold text-zinc-500">/day*</span>
                    </p>
                  </div>
                  <ButtonLink href="#cta" variant="ghost" className="!px-4 !py-2 !text-xs">
                    Book
                  </ButtonLink>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          *Indicative metro rates; final quotes depend on shift length, skill tier, and site context.
        </p>
      </Container>
    </section>
  )
}
