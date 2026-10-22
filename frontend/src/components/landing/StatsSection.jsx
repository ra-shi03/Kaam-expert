import { stats } from '../../data/landingContent'
import { AnimatedCounter } from '../ui/AnimatedCounter'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

export function StatsSection() {
  return (
    <section
      id="stats"
      className="relative overflow-hidden border-y border-blue-900/30 bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 py-16 text-white"
      aria-label="Platform statistics"
    >
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2240%22%20height=%2240%22%3E%3Cpath%20d=%22M0%2040h40V0%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20stroke-opacity=%22.04%22/%3E%3C/svg%3E')]" />
      <div className="lp-drift pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      <Container className="relative">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} scale={0.96} className="h-full">
              <div className="group h-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-bright/25 hover:bg-white/[0.05] hover:shadow-[0_0_40px_-12px_rgba(96,165,250,0.35)] sm:p-6 lg:text-left">
                <div className="text-2xl font-black tracking-tight tabular-nums text-transparent min-[400px]:text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-brand-bright via-white to-brand-bright bg-clip-text">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-2 text-xs font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300 sm:text-sm">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
