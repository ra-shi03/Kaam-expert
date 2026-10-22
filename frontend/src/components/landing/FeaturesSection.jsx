import { features } from '../../data/landingContent'
import { LandingIcon } from '../../lib/iconMap'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20"
      aria-labelledby="features-heading"
    >
      <div className="lp-drift pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_0%,rgba(0,43,92,0.1),transparent)]" />
      <Container className="relative">
        <SectionHeading
          titleId="features-heading"
          eyebrow="Why KaamExpert"
          title="Trust, speed, and clarity—by design"
          subtitle="We built verification, tracking, and payments into the core flow so contractors can focus on execution—not chasing people."
          align="center"
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.06}>
              <article
                className="group h-full rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm lp-hover-t hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_22px_50px_-24px_rgba(37,99,235,0.28)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/12 text-brand ring-1 ring-brand/20 lp-hover-t group-hover:scale-110 group-hover:bg-brand group-hover:text-white group-hover:ring-brand">
                  <LandingIcon name={f.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
