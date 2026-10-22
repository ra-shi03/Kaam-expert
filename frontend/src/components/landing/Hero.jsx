import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Building2, HardHat, ShieldCheck, Sparkles, UserCheck } from 'lucide-react'
import { trustBadges } from '../../data/landingContent'
import { LandingIcon } from '../../lib/iconMap'
import { Container } from '../ui/Container'
import { AnimatedServiceBackground } from './AnimatedServiceBackground'
import { QuickBookingWidget } from './QuickBookingWidget'
import { LiveBookingTicker } from './LiveBookingTicker'
import { useAuth } from '../../hooks/useAuth.js'
import { USER_ROLES } from '../../constants/userRoles.js'
import { writeBootRole } from '../../lib/bootPersona.js'

const ease = [0.22, 1, 0.36, 1]

const stack = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

const tileGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const tile = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } },
}

const HERO_METRICS = [
  { value: '45 mins', label: 'Avg. Arrival', tone: 'text-slate-900' },
  { value: '100%', label: 'Aadhaar KYC', tone: 'text-slate-900' },
  { value: '₹0', label: 'Advance Fee', tone: 'text-emerald-700' },
]

export function Hero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const bgOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.4])
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleHireLabour = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (user && user.role === USER_ROLES.CUSTOMER) {
      navigate('/app')
      return
    }
    logout().finally(() => {
      writeBootRole(USER_ROLES.CUSTOMER)
      navigate('/app')
    })
  }

  const handleContractorEntry = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (user && user.role === USER_ROLES.CONTRACTOR) {
      navigate('/app')
      return
    }
    logout().finally(() => {
      writeBootRole(USER_ROLES.CONTRACTOR)
      navigate('/app')
    })
  }

  const handleRegisterLabour = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    navigate('/labours/auth')
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="hero"
        className="relative overflow-hidden border-b border-slate-200/80 bg-white pt-24 pb-14 sm:pt-28 sm:pb-16 md:pt-32 md:pb-20"
        aria-labelledby="hero-heading"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={reduce ? undefined : { y: bgY, opacity: bgOpacity }}
        >
          <AnimatedServiceBackground />
        </motion.div>

        <Container className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
          {/* Left Column: Value Proposition & CTAs */}
          <motion.div
            className="space-y-6 sm:space-y-7"
            variants={stack}
            initial={reduce ? false : 'hidden'}
            animate="show"
          >
            <motion.div
              className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-full border border-brand/20 bg-brand/5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-brand shadow-xs backdrop-blur-sm lp-hover-t hover:border-brand/35 hover:bg-brand/8"
              variants={rise}
            >
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="h-3.5 w-3.5 shrink-0 fill-brand text-brand" aria-hidden />
                <span>Role-Based Platform for Customers & Contractors</span>
              </span>
              <span className="hidden sm:inline text-brand/40">·</span>
              <span className="text-slate-600 font-medium">100% Aadhaar Verified</span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                id="hero-heading"
                className="text-[2rem] font-black leading-[1.12] tracking-tight text-balance text-slate-900 sm:text-4xl sm:leading-tight lg:text-[2.95rem]"
                variants={rise}
              >
                Hire Verified Construction & Home Workforce with{' '}
                <span className="relative inline-block bg-gradient-to-r from-brand via-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Transparent Slabs
                  <motion.span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-brand via-blue-600 to-teal-600 opacity-70"
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6, ease }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
                variants={rise}
              >
                KaamExpert connects homeowners and construction contractors with certified,
                KYC-verified skilled artisans and helpers. Transparent hourly and full-day shift rates,
                zero advance fees, and guaranteed replacements.
              </motion.p>
            </div>

            {/* Quick Action Role Navigation Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3"
              variants={rise}
            >
              <a
                href="#services-pricing"
                className="lp-shine group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-bright to-brand px-5 py-3.5 sm:py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 active:translate-y-0 active:scale-[0.98] whitespace-nowrap"
              >
                <span>Explore Services & Rates</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={handleContractorEntry}
                  className="group inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md hover:shadow-brand/10 active:translate-y-0 active:scale-[0.98] whitespace-nowrap"
                >
                  <Building2 className="h-4 w-4 text-brand shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span>Contractor Portal</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegisterLabour}
                  className="group inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md hover:shadow-brand/10 active:translate-y-0 active:scale-[0.98] whitespace-nowrap"
                >
                  <HardHat className="h-4 w-4 text-emerald-600 shrink-0 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                  <span>Join as Labour</span>
                </button>
              </div>
            </motion.div>

            {/* Live Trust Metrics */}
            <motion.div
              className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-slate-200/90 pt-5 text-left"
              variants={tileGroup}
            >
              {HERO_METRICS.map((m) => (
                <motion.div
                  key={m.label}
                  variants={tile}
                  className="rounded-xl bg-slate-50/80 p-2 ring-1 ring-transparent lp-hover-t hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-brand/5 hover:ring-brand/20 sm:p-2.5"
                >
                  <p className={`text-lg font-black tabular-nums sm:text-2xl ${m.tone}`}>{m.value}</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 whitespace-nowrap">{m.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Badges Bar */}
            <motion.div className="flex flex-wrap gap-2" variants={tileGroup}>
              {trustBadges.map((b) => (
                <motion.div
                  key={b.id}
                  variants={tile}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs whitespace-nowrap lp-hover-t hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm"
                >
                  <LandingIcon name={b.icon} className="h-3.5 w-3.5 text-brand" />
                  <span>{b.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Instant Booking Engine */}
          <div className="relative">
            <div
              aria-hidden
              className="lp-drift pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand/10 blur-3xl"
            />
            <QuickBookingWidget onBook={() => navigate('/app/booking/flow?step=details')} />
          </div>
        </Container>
      </section>

      {/* Real-time Ticker across the site */}
      <LiveBookingTicker />
    </>
  )
}
