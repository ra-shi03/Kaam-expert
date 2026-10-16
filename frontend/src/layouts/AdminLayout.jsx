import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogOut,
  Mail,
  Menu,
  Search,
  X,
  PanelLeft,
  User,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { ADMIN_NAV_SECTIONS, getAdminTitle } from '../config/adminNavigation.js'
import { appSpring } from '../components/app/appMotion.js'
import { GlassPanel } from '../components/ui/GlassPanel.jsx'
import { adminInitials, formatLastLoginDisplay, formatLastLoginRelative } from '../lib/formatAdminLastLogin.js'

const STORAGE_KEY = 'lc-admin-sidebar-collapsed'

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const reduce = useReducedMotion()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setNotifOpen(false)
  }, [pathname])

  useEffect(() => {
    function handlePointerDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        setProfileOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const title = getAdminTitle(pathname)

  function handleLogout() {
    setProfileOpen(false)
    logout()
    navigate('/admin/login', { replace: true })
  }

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Administrator'
  const displayEmail = user?.email || '—'
  const lastLoginRaw = user?.lastLoginAt
  const lastLoginShort = formatLastLoginRelative(lastLoginRaw)
  const lastLoginFull = formatLastLoginDisplay(lastLoginRaw)
  const initials = adminInitials(user)

  const query = searchQuery.trim().toLowerCase()
  const filteredSections = query
    ? ADMIN_NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(query)),
      })).filter((section) => section.items.length > 0)
    : ADMIN_NAV_SECTIONS

  const sidebarInner = (
    <>
      <div className="shrink-0 border-b border-neutral-800 bg-black/20 px-3 py-3">
        <div className={`flex items-center ${collapsed ? 'md:justify-center' : 'justify-between'} ${!collapsed ? 'mb-3' : ''}`}>
          <Link
            to="/admin"
            className={`flex min-w-0 items-center gap-2 px-1 ${collapsed ? 'md:justify-center' : ''}`}
            title="Dashboard"
          >
            <img src="/logo-transparent.png" alt="KaamExpert" className="h-9 w-auto max-w-[9.5rem] shrink-0 object-contain brightness-0 invert" />
            <span className={`min-w-0 ${collapsed ? 'md:sr-only' : ''}`}>
              <span className="block text-[10px] uppercase tracking-wider text-white/50">Control panel</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-1.5 text-white/80 transition hover:scale-110 hover:bg-white/10 hover:text-white md:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`relative ${collapsed ? 'md:hidden' : ''}`}>
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/60" aria-hidden />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`h-9 w-full rounded-md border border-white/20 bg-white/10 pl-9 text-sm text-white outline-none transition placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/40 ${searchQuery ? 'pr-9' : 'pr-3'}`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-white/60 transition hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 scrollbar-thin [scrollbar-color:rgba(255,255,255,0.25)_transparent]"
        aria-label="Admin navigation"
      >
        {filteredSections.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm font-medium text-white/60">No menu items found</p>
            <p className="mt-1 text-xs text-white/40">Try a different search term</p>
          </div>
        ) : (
          filteredSections.map((section, si) => (
            <div key={section.title ?? 'main'} className={si > 0 ? 'mt-4' : ''}>
              {section.title ? (
                <div className={`mb-1 px-3 py-1.5 ${collapsed ? 'md:hidden' : ''}`}>
                  <span className="text-sm font-bold uppercase tracking-wider text-white/60">{section.title}</span>
                </div>
              ) : null}
              <ul className="space-y-1">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={Boolean(end)}
                      title={label}
                      className={({ isActive }) =>
                        `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-out ${collapsed ? 'md:justify-center md:px-2' : ''} ${
                          isActive
                            ? 'bg-white font-semibold text-neutral-950 shadow-md shadow-black/10'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-all duration-300 ${isActive ? 'scale-110 text-neutral-950' : 'text-white/85'}`}
                            aria-hidden
                          />
                          <span className={`min-w-0 flex-1 truncate ${collapsed ? 'md:sr-only' : ''}`}>{label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>
    </>
  )

  const sidebarClassName = `
    flex h-dvh max-h-dvh shrink-0 flex-col overflow-hidden border-r border-neutral-900 bg-black transition-[transform,width] duration-300 ease-out
    w-[min(20rem,88vw)] max-md:max-w-[20rem]
    ${collapsed ? 'md:w-20' : 'md:w-80'}
    fixed inset-y-0 left-0 z-50 md:relative md:z-20
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-white text-slate-900">
      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            key="admin-overlay"
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm md:hidden"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside className={`${sidebarClassName} hide-on-print`}>{sidebarInner}</aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="hide-on-print relative z-30 flex h-17 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-3 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.12)] backdrop-blur-xl md:gap-4 md:px-6">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-700 shadow-sm transition hover:border-brand/30 hover:shadow-md md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 shadow-sm transition hover:border-brand/30 hover:shadow-md md:flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1 py-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">{title}</h1>
              {lastLoginShort ? (
                <span className="hidden items-center gap-1 text-[11px] font-semibold text-slate-400 sm:inline-flex">
                  <Clock className="h-3 w-3 shrink-0 text-brand/70" aria-hidden />
                  <span className="truncate">Last login · {lastLoginShort}</span>
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs font-medium text-slate-500">Super control panel · Work Scope modules</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o)
                  setProfileOpen(false)
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 shadow-sm transition hover:border-brand/25 hover:text-brand hover:shadow-md"
                aria-expanded={notifOpen}
                aria-haspopup="true"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden />
              </button>
              <AnimatePresence>
                {notifOpen ? (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),20rem)] origin-top-right"
                  >
                    <GlassPanel className="p-4 shadow-xl ring-1 ring-slate-200/60">
                      <p className="text-sm font-bold text-slate-900">Notifications</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        No new alerts. Booking approvals, KYC queues, and payment events will appear here.
                      </p>
                    </GlassPanel>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o)
                  setNotifOpen(false)
                }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:border-brand/25 hover:shadow-md md:pr-3"
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label="Account menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-bright to-brand text-xs font-black text-white shadow-inner ring-2 ring-white">
                  {initials}
                </span>
                <div className="hidden min-w-0 text-left lg:block">
                  <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                  <p className="truncate text-[11px] font-medium text-slate-500">{displayEmail}</p>
                </div>
                <ChevronDown
                  className={`hidden h-4 w-4 shrink-0 text-slate-400 transition lg:block ${profileOpen ? '-rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),19rem)] origin-top-right"
                  >
                    <GlassPanel className="overflow-hidden p-0 shadow-xl ring-1 ring-slate-200/60">
                      <div className="border-b border-slate-100 bg-linear-to-br from-slate-50/95 to-white px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand-bright to-brand text-sm font-black text-white shadow-lg ring-4 ring-white/80">
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-900">{displayName}</p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-slate-600">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                              {displayEmail}
                            </p>
                          </div>
                        </div>
                        {lastLoginFull ? (
                          <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                            Last login: {lastLoginFull}
                          </p>
                        ) : (
                          <p className="mt-3 text-[11px] font-medium text-slate-500">Last login not available yet.</p>
                        )}
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          onClick={() => {
                            setProfileOpen(false)
                            navigate('/admin/profile')
                          }}
                        >
                          <User className="h-4 w-4 text-slate-400" aria-hidden />
                          Profile settings
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" aria-hidden />
                          Log out
                        </button>
                      </div>
                    </GlassPanel>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : appSpring}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
