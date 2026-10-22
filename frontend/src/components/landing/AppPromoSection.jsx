import { motion } from 'framer-motion'
import { ArrowUpRight, HardHat, Smartphone, User } from 'lucide-react'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import qrUserApp from '../../assets/qr-user-app.svg'
import qrLabourApp from '../../assets/qr-labour-app.svg'

const USER_APP_URL = 'https://play.google.com/store/apps/details?id=com.kaamexpert.user'
const LABOUR_APP_URL = 'https://play.google.com/store/apps/details?id=com.kaamexpert.labour'

function PhoneMock({ label, accent, floatClass = 'lp-float' }) {
  return (
    <motion.div
      className="relative mx-auto w-[8.5rem] shrink-0 sm:w-[11rem]"
      whileHover={{ y: -8, rotate: -1.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className={floatClass}>
        <div
          className={`rounded-[2rem] border border-slate-700 bg-slate-900 p-2 shadow-[0_24px_60px_-20px_rgba(0,43,92,0.2)] ring-1 ring-black/5`}
        >
          <div className="overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-zinc-900 to-black">
            <div className="flex items-center justify-between px-4 pb-2 pt-4 text-[10px] text-zinc-500">
              <span>9:41</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-brand-bright">
                LTE
              </span>
            </div>
            <div className={`mx-4 mb-3 h-24 rounded-2xl bg-gradient-to-br ${accent} opacity-90`} />
            <div className="space-y-2 px-4 pb-5">
              <div className="h-2.5 w-2/3 rounded-full bg-zinc-800" />
              <div className="h-2 w-full rounded-full bg-zinc-800/80" />
              <div className="h-2 w-5/6 rounded-full bg-zinc-800/60" />
              <div className="mt-3 h-9 rounded-xl bg-brand/90" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-zinc-600">{label}</p>
    </motion.div>
  )
}

export function AppPromoSection() {
  return (
    <section id="app" className="overflow-hidden bg-white py-16 text-zinc-900 sm:py-20" aria-labelledby="app-heading">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <SectionHeading
              titleId="app-heading"
              eyebrow="Mobile apps"
              title="Carry KaamExpert in your pocket"
              subtitle="Book verified professionals on-demand, track attendance, and manage shifts with fast, reliable mobile apps built for both customers and workers."
            />

            {/* Direct Google Play Store Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={USER_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-bright to-brand px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand/20 transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <User className="h-4 w-4" />
                <span>Customer & Contractor App</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href={LABOUR_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
              >
                <HardHat className="h-4 w-4 text-emerald-600" />
                <span>Labour Partner App</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            {/* Real QR Code Cards for Both Apps */}
            <Reveal className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Scan QR Code to Install directly from Google Play
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {/* Customer App QR */}
                <a
                  href={USER_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-center transition-all hover:border-brand/40 hover:bg-white hover:shadow-lg hover:shadow-brand/5"
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-2xs group-hover:scale-105 transition-transform">
                    <img
                      src={qrUserApp}
                      alt="Scan to download KaamExpert Customer & Contractor App"
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <span className="mt-2.5 text-xs font-bold text-slate-800 group-hover:text-brand transition-colors">
                    Customer App
                  </span>
                  <span className="text-[10px] text-slate-500">Google Play Store</span>
                </a>

                {/* Labour App QR */}
                <a
                  href={LABOUR_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-center transition-all hover:border-brand/40 hover:bg-white hover:shadow-lg hover:shadow-brand/5"
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-2xs group-hover:scale-105 transition-transform">
                    <img
                      src={qrLabourApp}
                      alt="Scan to download KaamExpert Labour Partner App"
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <span className="mt-2.5 text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    Labour Partner App
                  </span>
                  <span className="text-[10px] text-slate-500">Google Play Store</span>
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal x={24} y={0}>
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/90 to-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="lp-drift pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
              <div className="flex items-end justify-center gap-4 sm:gap-6">
                <PhoneMock label="Customer / Contractor App" accent="from-brand-bright to-brand" />
                <PhoneMock label="Labour Partner App" accent="from-surface-800 to-surface-950" floatClass="lp-float-delayed" />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

