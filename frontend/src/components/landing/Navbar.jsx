import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { ArrowRight, HardHat, Menu, X } from 'lucide-react'
import { Container } from '../ui/Container'
import { SITE } from '../../data/landingContent'
import { useAuth } from '../../hooks/useAuth.js'
import { USER_ROLES } from '../../constants/userRoles.js'
import { writeBootRole } from '../../lib/bootPersona.js'

const links = [
  { href: '#services-pricing', label: 'Services & Rates' },
  { href: '#tools', label: 'Trade Tools' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#roles', label: 'Roles' },
  { href: '#testimonials', label: 'Reviews' },
  { href: '#faq', label: 'FAQ' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeHref, setActiveHref] = useState('')
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleHireLabour = (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (user && user.role === USER_ROLES.CUSTOMER) {
      navigate('/app')
      return
    }
    logout().finally(() => {
      writeBootRole(USER_ROLES.CUSTOMER)
      navigate('/app')
    })
  }

  const handleRegisterLabour = (e) => {
    if (e?.preventDefault) e.preventDefault()
    navigate('/labours/auth')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onResize = () => desktop.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onResize)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onResize)
    }
  }, [open])

  // Scroll-spy: highlight the nav link for the section currently in view
  useEffect(() => {
    const sections = links
      .map((l) => document.querySelector(l.href))
      .filter(Boolean)
    if (!sections.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveHref(`#${visible.target.id}`)
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    )
    sections.forEach((el) => observer.observe(el))

    const onTop = () => window.scrollY < 200 && setActiveHref('')
    window.addEventListener('scroll', onTop, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onTop)
    }
  }, [])

  const linkClass = scrolled
    ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
    : 'text-slate-700 hover:bg-slate-100/60 hover:text-slate-900'

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open ? (
          <motion.button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-200/40 backdrop-blur-xl'
          : 'border-b border-slate-200/40 bg-white/85 backdrop-blur-md'
      }`}
    >
      <Container className="flex h-16 md:h-[4.25rem] items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <a
            href="#hero"
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-bright to-brand text-white shadow-md shadow-brand/20">
              <HardHat className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <span className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
              {SITE.name}
            </span>
          </a>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden items-center gap-0.5 xl:gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => {
            const isActive = activeHref === l.href
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? 'true' : undefined}
                className={`relative isolate rounded-xl px-3 py-2 text-xs font-bold tracking-tight whitespace-nowrap transition-colors duration-200 xl:text-sm ${
                  isActive ? 'text-brand' : linkClass
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="navActivePill"
                    className="absolute inset-0 -z-10 rounded-xl bg-brand/8 ring-1 ring-brand/15"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                {l.label}
              </a>
            )
          })}
        </nav>

        {/* Right Action Buttons (Desktop) */}
        <div className="hidden items-center gap-2 xl:gap-2.5 lg:flex shrink-0">
          <Link
            to="/auth"
            className="rounded-xl px-3 py-2 text-xs font-bold text-slate-700 whitespace-nowrap transition-colors duration-200 hover:text-slate-900 hover:bg-slate-100 xl:text-sm"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={handleRegisterLabour}
            className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs whitespace-nowrap transition-all duration-200 hover:-translate-y-px hover:border-brand/40 hover:text-brand hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
          >
            Join as Labour
          </button>
          <a
            href="#services-pricing"
            className="lp-shine group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-bright to-brand px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand/20 whitespace-nowrap transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-brand/30 active:translate-y-0 active:scale-[0.98]"
          >
            <span>Book Online</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors active:bg-slate-50 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? 'close' : 'menu'}
              initial={reduce ? false : { rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </motion.span>
          </AnimatePresence>
        </button>
      </Container>

      {/* Scroll progress indicator */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-brand-bright to-brand"
        style={{ scaleX: reduce ? scrollYProgress : progress }}
      />

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white shadow-xl lg:hidden"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Container className="flex flex-col gap-1 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center justify-between rounded-xl px-4 text-[15px] font-bold transition-colors active:bg-slate-100 ${
                    activeHref === l.href ? 'bg-brand/8 text-brand' : 'text-slate-800 hover:bg-slate-50'
                  }`}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {l.label}
                  <ArrowRight className="h-4 w-4 opacity-40" aria-hidden />
                </motion.a>
              ))}

              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <a
                  href="#services-pricing"
                  onClick={() => setOpen(false)}
                  className="lp-shine flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-bright to-brand text-center text-sm font-bold text-white shadow-md shadow-brand/20 active:scale-[0.98]"
                >
                  Book Online
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    setOpen(false)
                    handleRegisterLabour(e)
                  }}
                  className="min-h-12 rounded-xl border border-slate-200 bg-white text-center text-sm font-bold text-slate-800 shadow-2xs active:scale-[0.98] active:bg-slate-50"
                >
                  Register as Labour Partner
                </button>
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-center text-sm font-bold text-brand"
                >
                  Sign in to Account
                </Link>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
    </>
  )
}
