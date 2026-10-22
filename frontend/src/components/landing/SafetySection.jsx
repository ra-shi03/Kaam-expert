import { safetyPoints } from '../../data/landingContent'
import { LandingIcon } from '../../lib/iconMap'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

export function SafetySection() {
  return (
    <section
      id="safety"
      className="border-y border-slate-200/80 bg-white py-20 text-zinc-900"
      aria-labelledby="safety-heading"
    >
      <Container>
        <SectionHeading
          titleId="safety-heading"
          eyebrow="Safety & verification"
          title="Serious sites need serious checks"
          subtitle="Verification is not a checkbox PDF—it’s a live system that pairs identity, behaviour, and payments so everyone sleeps better after a long shift."
          align="center"
        />

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {safetyPoints.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.07} className="h-full">
              <article
                className="group h-full rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lp-hover-t hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_22px_50px_-24px_rgba(37,99,235,0.28)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-transparent lp-hover-t group-hover:scale-110 group-hover:bg-brand group-hover:text-white group-hover:ring-brand">
                  <LandingIcon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
