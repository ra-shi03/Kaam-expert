import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Coffee,
  Fan,
  Hammer,
  HardHat,
  HeartPulse,
  Layers,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserCheck,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react'
import { createEmptyDraft, writeBookingDraft } from '../../lib/individualBookingDraft.js'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { DB_CATEGORIES, DB_SERVICES } from '../../data/dbServicesSeed.js'

const ICON_MAP = {
  Hammer,
  Wrench,
  Zap,
  Fan,
  Paintbrush,
  Sparkles,
  Utensils,
  Truck,
  Car,
  ShieldCheck,
  Camera,
  Coffee,
  HeartPulse,
  UserCheck,
  Layers,
}

const THEME_STYLES = {
  amber: 'bg-amber-50 text-amber-600 ring-amber-200/80',
  sky: 'bg-sky-50 text-sky-600 ring-sky-200/80',
  yellow: 'bg-amber-50 text-amber-600 ring-amber-200/80',
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-200/80',
  rose: 'bg-rose-50 text-rose-600 ring-rose-200/80',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200/80',
  orange: 'bg-orange-50 text-orange-600 ring-orange-200/80',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-200/80',
  blue: 'bg-blue-50 text-blue-600 ring-blue-200/80',
  slate: 'bg-slate-100 text-slate-700 ring-slate-300',
  violet: 'bg-violet-50 text-violet-600 ring-violet-200/80',
  pink: 'bg-pink-50 text-pink-600 ring-pink-200/80',
  red: 'bg-red-50 text-red-600 ring-red-200/80',
  teal: 'bg-teal-50 text-teal-600 ring-teal-200/80',
}

const APP_CATEGORIES = [
  { id: 'all', label: 'All Services', icon: Layers },
  ...DB_CATEGORIES.filter((c) => c.popular || c.servicesCount > 0).map((c) => ({
    id: c.slug,
    label: c.name,
    icon: ICON_MAP[c.icon] || Layers,
  })),
]

function getSlotsForService(hourlyPrice, dailyPrice) {
  const baseH = Number(hourlyPrice) || 200
  const baseD = Number(dailyPrice) || Math.round(baseH * 6.5)

  return [
    { label: '1 Hr', minutes: 60, price: baseH, original: Math.round(baseH * 1.2), discount: '15% off' },
    { label: '2 Hrs', minutes: 120, price: Math.round(baseH * 1.8), original: Math.round(baseH * 2.2), discount: '18% off' },
    { label: '4 Hrs', minutes: 240, price: Math.round(baseD * 0.55), original: Math.round(baseD * 0.7), discount: '20% off' },
    { label: '8 Hrs', minutes: 480, price: baseD, original: Math.round(baseD * 1.25), discount: '20% off', popular: true },
  ]
}

export function ServicesGrid() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedSlotIndex, setSelectedSlotIndex] = useState({})

  // Filter real services from MongoDB
  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') {
      return DB_SERVICES.slice(0, 24)
    }
    return DB_SERVICES.filter((s) => s.categorySlug === activeCategory)
  }, [activeCategory])

  function handleSelectSlot(serviceId, slotIndex) {
    setSelectedSlotIndex((prev) => ({
      ...prev,
      [serviceId]: slotIndex,
    }))
  }

  function handleBookService(service) {
    const slots = getSlotsForService(service.hourlyPrice, service.dailyPrice)
    const slotIdx = selectedSlotIndex[service.id] ?? 0
    const chosenSlot = slots[slotIdx] || slots[0]

    const draft = {
      ...createEmptyDraft(),
      entryPoint: 'category',
      groupId: service.categoryId,
      categoryId: service.subcategoryId,
      serviceId: service.id,
      groupName: service.categoryName,
      categoryName: service.subcategoryName || service.categoryName,
      serviceName: service.title,
      durationMinutes: chosenSlot.minutes,
      selectedSlotLabel: chosenSlot.label === '8 Hrs' ? '8 Hours (Full Day Shift)' : `${chosenSlot.label} Slot`,
      slotPrice: chosenSlot.price,
      durationKind: chosenSlot.minutes >= 480 ? 'full_day' : 'few_hours',
    }
    writeBookingDraft(draft)
    navigate(`/app/booking/flow?step=details&categoryId=${service.subcategoryId}&groupId=${service.categoryId}`)
  }

  return (
    <section
      id="services-pricing"
      className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/60 py-20 md:py-28 text-slate-900"
      aria-labelledby="services-pricing-heading"
    >
      <span id="services" className="sr-only" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#2563eb07_1px,transparent_1px)] [background-size:24px_24px]" />

      <Container className="relative">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Verified Services & Transparent Pricing</span>
          </motion.div>

          <motion.h2
            id="services-pricing-heading"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-[1.75rem] leading-tight font-black tracking-tight text-balance text-slate-900 sm:text-4xl md:text-5xl"
          >
            All Services with Transparent Rates
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mt-3 text-base text-slate-600 sm:text-lg"
          >
            Verified services across top home and construction trades. Pick your service, choose an hourly or
            full-day duration, and book verified professionals directly.
          </motion.p>
        </div>

        {/* Category Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm">
          <div className="lp-fade-end no-scrollbar flex snap-x gap-1.5 overflow-x-auto overscroll-x-contain">
            {APP_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id
              const CatIcon = cat.icon
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={active}
                  className={`relative flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 active:scale-[0.97] sm:text-sm ${
                    active ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeAppCategoryPill"
                      className="absolute inset-0 rounded-xl bg-brand shadow-md shadow-brand/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <CatIcon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{cat.label}</span>
                </button>
              )
            })}
          </div>
          </div>
        </div>

        {/* Services Grid Cards */}
        <motion.div
          layout
          className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              const Icon = ICON_MAP[service.icon] || Layers
              const iconThemeClass = THEME_STYLES[service.color] || THEME_STYLES.blue
              const slots = getSlotsForService(service.hourlyPrice, service.dailyPrice)
              const slotIdx = selectedSlotIndex[service.id] ?? 0
              const activeSlot = slots[slotIdx] || slots[0]

              return (
                <motion.article
                  layout
                  key={service.id}
                  initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : (index % 8) * 0.045 }}
                  className="lp-hover-t group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_24px_50px_-12px_rgba(37,99,235,0.18)]"
                >
                  <div>
                    {/* Header: Icon & Live Availability Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <span className={`lp-hover-t flex h-12 w-12 items-center justify-center rounded-2xl ring-1 group-hover:-rotate-6 group-hover:scale-110 ${iconThemeClass}`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {service.availability}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{service.rating}</span>
                          <span className="text-slate-400 font-normal">({service.reviewsCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Subcategory & Title */}
                    <div className="mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                        {service.categoryName} • {service.subcategoryName}
                      </span>
                      <h3 className="mt-0.5 text-lg font-extrabold text-slate-900 transition-colors duration-300 group-hover:text-brand">
                        {service.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    {/* Shift & Duration Selector */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <span>Select Shift Duration</span>
                        {activeSlot.discount && (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                            {activeSlot.discount}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-1">
                        {slots.map((s, idx) => {
                          const isSlotActive = idx === slotIdx
                          return (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => handleSelectSlot(service.id, idx)}
                              aria-pressed={isSlotActive}
                              className={`min-h-10 rounded-xl px-1 py-2 text-center text-[11px] font-bold transition-all duration-200 active:scale-95 sm:min-h-9 sm:py-1.5 ${
                                isSlotActive
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Live Price & Direct Book CTA */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={activeSlot.price}
                              initial={reduce ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                              transition={{ duration: 0.22 }}
                              className="text-2xl font-black tabular-nums text-slate-900"
                            >
                              ₹{activeSlot.price}
                            </motion.span>
                          </AnimatePresence>
                          {activeSlot.original && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{activeSlot.original}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500">
                          {activeSlot.label === '8 Hrs' ? 'Full Day 8h Shift' : `${activeSlot.label} Job Slot`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookService(service)}
                        className="lp-shine group/btn inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-brand/25 active:scale-[0.97]"
                      >
                        <span>Book Now</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Standardized Trade Rate Card Table */}
        <Reveal className="mt-14 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm sm:mt-16">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
                KaamExpert Standard Service Rate Card
              </h3>
              <p className="text-xs text-slate-500">
                Transparent standardized base rates across all trades. Zero hidden commissions.
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200/80">
                <ShieldCheck className="h-3.5 w-3.5" /> Direct Digital Invoicing
              </span>
            </div>
          </div>

          {/* Mobile: stacked rate rows */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {DB_SERVICES.slice(0, 10).map((item) => {
              const Icon = ICON_MAP[item.icon] || Layers
              const iconThemeClass = THEME_STYLES[item.color] || THEME_STYLES.blue
              const slots = getSlotsForService(item.hourlyPrice, item.dailyPrice)
              return (
                <li key={item.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${iconThemeClass}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">{item.title}</p>
                      <p className="truncate text-[11px] text-slate-500">{item.categoryName} • {item.subcategoryName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBookService(item)}
                      className="min-h-10 shrink-0 rounded-xl border border-brand bg-white px-3.5 text-xs font-bold text-brand transition-colors active:bg-brand active:text-white"
                    >
                      Book
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">1h</dt>
                      <dd className="font-mono text-sm font-bold text-slate-700">₹{slots[0].price}</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">4h</dt>
                      <dd className="font-mono text-sm font-bold text-slate-800">₹{slots[2].price}</dd>
                    </div>
                    <div className="rounded-xl bg-emerald-50/70 px-2 py-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">8h</dt>
                      <dd className="font-mono text-sm font-bold text-emerald-700">₹{slots[3].price}</dd>
                    </div>
                  </dl>
                </li>
              )
            })}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Category & Service</th>
                  <th className="px-5 py-3">Quick Slot (1h)</th>
                  <th className="px-5 py-3">Half Day (4h)</th>
                  <th className="px-5 py-3">Full Day (8h Shift)</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DB_SERVICES.slice(0, 10).map((item) => {
                  const Icon = ICON_MAP[item.icon] || Layers
                  const iconThemeClass = THEME_STYLES[item.color] || THEME_STYLES.blue
                  const slots = getSlotsForService(item.hourlyPrice, item.dailyPrice)
                  return (
                    <tr key={item.id} className="group/row transition-colors duration-200 hover:bg-brand/[0.03]">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover/row:scale-110 ${iconThemeClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <p className="text-[11px] text-slate-500">{item.categoryName} • {item.subcategoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                        ₹{slots[0].price}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        ₹{slots[2].price}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        ₹{slots[3].price}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleBookService(item)}
                          className="rounded-xl border border-brand bg-white px-3.5 py-1.5 text-xs font-bold text-brand transition-all duration-200 hover:bg-brand hover:text-white hover:shadow-md hover:shadow-brand/20 active:scale-[0.97]"
                        >
                          Book {item.title.split(' ')[0]}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Bottom Booking Guarantee Footer */}
        <Reveal y={12} className="mt-8 flex flex-col items-center justify-center gap-3 text-center text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-6">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Free replacement within 60 mins if unsatisfied
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="h-4 w-4 text-brand" /> Direct UPI / In-app wallet settlement
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Award className="h-4 w-4 text-amber-500" /> GST-compliant digital invoicing for Contractors
          </span>
        </Reveal>
      </Container>
    </section>
  )
}