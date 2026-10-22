import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Flame,
  Hammer,
  HardHat,
  Layers,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Tractor,
  Wrench,
  Zap,
} from 'lucide-react'
import { Container } from '../ui/Container'
import { createEmptyDraft, writeBookingDraft } from '../../lib/individualBookingDraft.js'

const TOOLS_DATA = [
  {
    id: 'trowel',
    toolName: 'Masonry Trowel & Spirit Level',
    tradeName: 'Mason (Raj Mistri) & Tile Installer',
    category: 'Construction',
    icon: Layers,
    color: 'amber',
    iconBg: 'bg-amber-50 text-amber-600 ring-amber-200/80',
    borderActive: 'border-amber-400 ring-2 ring-amber-400/20',
    badge: 'Civil Core',
    description: 'Precision tools used for brick laying, 90-degree alignment, wall plastering, and floor tile installation.',
    baseRate: 800,
    rateUnit: '/day',
    tasks: ['Brickwork & Block Masonry', 'Smooth Sand-Cement Plaster', 'Tile & Marble Flooring', 'Structural Repairs'],
    services: [
      { name: 'Mason (Raj Mistri)', price: 800, id: 'mason' },
      { name: 'Tile Installer', price: 800, id: 'tile-installer' },
      { name: 'POP Worker', price: 600, id: 'pop-worker' },
    ],
  },
  {
    id: 'multimeter',
    toolName: 'Digital Multimeter & Wire Stripper',
    tradeName: 'Certified Electrician',
    category: 'Construction',
    icon: Zap,
    color: 'blue',
    iconBg: 'bg-blue-50 text-blue-600 ring-blue-200/80',
    borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
    badge: 'Electrical',
    description: 'Voltage, continuity, and current testing tools for safe residential and site wiring installations.',
    baseRate: 650,
    rateUnit: '/day',
    tasks: ['Conduit & Concealed Wiring', 'Distribution Board Setup', 'Appliance & Inverter Connection', 'Short Circuit Troubleshooting'],
    services: [
      { name: 'Electrician', price: 650, id: 'electrician' },
      { name: 'Solar Panel Technician', price: 900, id: 'solar-technician' },
      { name: 'HVAC Technician', price: 800, id: 'hvac-technician' },
    ],
  },
  {
    id: 'wrench',
    toolName: 'Adjustable Pipe Wrench & Pressure Kit',
    tradeName: 'Plumber & Pipe Specialist',
    category: 'Construction',
    icon: Wrench,
    color: 'cyan',
    iconBg: 'bg-cyan-50 text-cyan-600 ring-cyan-200/80',
    borderActive: 'border-cyan-400 ring-2 ring-cyan-400/20',
    badge: 'Sanitary',
    description: 'Heavy plumbing wrenches and thread sealants for leak-proof CPVC, UPVC, and GI pipe installations.',
    baseRate: 600,
    rateUnit: '/day',
    tasks: ['Water Supply Lines (CPVC/GI)', 'Drainage & Sanitary Fittings', 'Overhead Tank & Pump Setup', 'Concealed Valve Repairs'],
    services: [
      { name: 'Plumber', price: 600, id: 'plumber' },
      { name: 'Waterproofing Worker', price: 750, id: 'waterproofing' },
    ],
  },
  {
    id: 'roller',
    toolName: 'High-Density Paint Roller & Putty Blade',
    tradeName: 'Painter & Surface Specialist',
    category: 'Construction',
    icon: Paintbrush,
    color: 'rose',
    iconBg: 'bg-rose-50 text-rose-600 ring-rose-200/80',
    borderActive: 'border-rose-400 ring-2 ring-rose-400/20',
    badge: 'Finishing',
    description: 'Professional scrapers, putty applicators, and microfiber rollers for mirror-smooth wall finishes.',
    baseRate: 500,
    rateUnit: '/day',
    tasks: ['Acrylic Wall Putty & Sanding', 'Interior Emulsion Application', 'Weatherproof Exterior Coats', 'Wood Polish & Enamel Paint'],
    services: [
      { name: 'Painter', price: 500, id: 'painter' },
      { name: 'Waterproofing Worker', price: 750, id: 'waterproofing' },
    ],
  },
  {
    id: 'saw',
    toolName: 'Wood Hand Saw & Clamping Rig',
    tradeName: 'Carpenter & Shuttering Expert',
    category: 'Construction',
    icon: Hammer,
    color: 'indigo',
    iconBg: 'bg-indigo-50 text-indigo-600 ring-indigo-200/80',
    borderActive: 'border-indigo-400 ring-2 ring-indigo-400/20',
    badge: 'Woodwork',
    description: 'Carpentry saws, bevels, and chisels used for door frame installations, modular woodwork, and concrete shuttering.',
    baseRate: 700,
    rateUnit: '/day',
    tasks: ['Door & Window Frame Fitting', 'Concrete Shuttering Formwork', 'Laminate & Modular Assembly', 'Hardware & Lock Installation'],
    services: [
      { name: 'Carpenter', price: 700, id: 'carpenter' },
      { name: 'Shuttering Carpenter', price: 750, id: 'shuttering-carpenter' },
      { name: 'Bar Bender (Steel Fixer)', price: 700, id: 'bar-bender' },
    ],
  },
  {
    id: 'helmet',
    toolName: 'ISI Safety Helmet & Loading Gear',
    tradeName: 'General Labour & Site Helpers',
    category: 'Site Labour',
    icon: HardHat,
    color: 'emerald',
    iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-200/80',
    borderActive: 'border-emerald-400 ring-2 ring-emerald-400/20',
    badge: 'Site Support',
    description: 'Personal safety equipment and material handling gear for manual labor, scaffolding assist, and loading.',
    baseRate: 400,
    rateUnit: '/day',
    tasks: ['Building Material Shifting', 'Concrete Mortar Batching', 'Site Cleanup & Rubble Removal', 'Loading & Unloading Trucks'],
    services: [
      { name: 'General Labor / Helper', price: 400, id: 'general-helper' },
      { name: 'Construction Helper', price: 450, id: 'construction-helper' },
      { name: 'Loader / Unloader', price: 500, id: 'loader' },
      { name: 'Scaffolding Worker', price: 600, id: 'scaffolding' },
    ],
  },
  {
    id: 'machinery',
    toolName: 'Dual-Axis Hydraulic Controls',
    tradeName: 'Certified Machine Operators',
    category: 'Machine Operators',
    icon: Tractor,
    color: 'violet',
    iconBg: 'bg-violet-50 text-violet-600 ring-violet-200/80',
    borderActive: 'border-violet-400 ring-2 ring-violet-400/20',
    badge: 'Heavy Plant',
    description: 'Certified operators trained in operating heavy hydraulic machinery, excavation equipment, and tower cranes.',
    baseRate: 1000,
    rateUnit: '/day',
    tasks: ['Foundation Earth Excavation', 'Site Leveling & Trenching', 'Heavy Material Crane Hoisting', 'Road Construction Operations'],
    services: [
      { name: 'JCB Operator', price: 1000, id: 'jcb-operator' },
      { name: 'Excavator Operator', price: 1200, id: 'excavator-operator' },
      { name: 'Crane Operator', price: 1500, id: 'crane-operator' },
      { name: 'Forklift Operator', price: 800, id: 'forklift-operator' },
    ],
  },
]

export function InteractiveServiceTools() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [selectedToolId, setSelectedToolId] = useState('trowel')

  const activeTool = TOOLS_DATA.find((t) => t.id === selectedToolId) || TOOLS_DATA[0]
  const ActiveIcon = activeTool.icon

  function handleBookTrade(service) {
    const draft = {
      ...createEmptyDraft(),
      entryPoint: 'category',
      categoryId: service.id,
      categoryName: service.name,
      serviceName: service.name,
      slotPrice: service.price,
      durationMinutes: 480,
      selectedSlotLabel: '8 Hours (Full Day)',
      durationKind: 'full_day',
    }
    writeBookingDraft(draft)
    navigate(`/app/booking/flow?step=details&categoryId=${service.id}`)
  }

  return (
    <section id="tools" className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 md:py-28">
      {/* Decorative Blueprint Lines */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#2563eb07_1px,transparent_1px)] [background-size:28px_28px]" />

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
            <span>Interactive Equipment & Trade Explorer</span>
          </motion.div>

          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-[1.75rem] leading-tight font-black tracking-tight text-balance text-slate-900 sm:text-4xl md:text-5xl"
          >
            Explore Tools of the Trade & Real App Services
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mt-3 text-base text-slate-600 sm:text-lg"
          >
            Select any trade tool below to see the exact skills, tasks, and verified professionals
            available for booking through KaamExpert.
          </motion.p>
        </div>

        {/* Interactive Tool Selector Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-12 sm:gap-2.5">
          {TOOLS_DATA.map((tool) => {
            const isSelected = tool.id === selectedToolId
            const ToolIcon = tool.icon

            return (
              <motion.button
                key={tool.id}
                type="button"
                onClick={() => setSelectedToolId(tool.id)}
                aria-pressed={isSelected}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className={`lp-hover-t group relative flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold hover:-translate-y-0.5 sm:gap-2.5 sm:px-4 sm:py-2.5 sm:text-sm ${
                  isSelected
                    ? `${tool.borderActive} bg-white shadow-md shadow-brand/10 text-slate-900`
                    : 'border-slate-200/90 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className={`lp-hover-t flex h-7 w-7 items-center justify-center rounded-xl ring-1 group-hover:-rotate-6 group-hover:scale-110 ${tool.iconBg}`}>
                  <ToolIcon className="h-4 w-4" />
                </span>
                <span>{tool.toolName.split('&')[0]}</span>
                {isSelected && (
                  <motion.span
                    layoutId="toolSelectedDot"
                    className="h-1.5 w-1.5 rounded-full bg-brand"
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Interactive Tool Details Showcase Card */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-6 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-white p-4 shadow-xl shadow-slate-200/40 sm:gap-8 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8"
            >
              {/* Left Column: Tool Specs & Tasks */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 shadow-sm ${activeTool.iconBg}`}>
                    <ActiveIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                        {activeTool.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{activeTool.category}</span>
                    </div>
                    <h3 className="mt-0.5 text-xl font-extrabold text-slate-900 sm:text-2xl">
                      {activeTool.toolName}
                    </h3>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  {activeTool.description}
                </p>

                {/* Key On-Site Tasks Handled */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    On-Site Tasks Handled
                  </h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {activeTool.tasks.map((task, i) => (
                      <motion.div
                        key={task}
                        initial={reduce ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.08 + i * 0.04 }}
                        className="lp-hover-t flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-emerald-200 hover:shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{task}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Aadhaar KYC Verified
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="h-4 w-4 text-brand" /> Direct Shift Attendance
                  </span>
                </div>
              </div>

              {/* Right Column: App Services & Rates Matching This Tool */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      Available Services in App
                    </h4>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                      Live Base Rates
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {activeTool.services.map((svc, i) => (
                      <motion.div
                        key={svc.name}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
                        className="lp-hover-t flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:-translate-y-0.5 hover:border-brand/25 hover:bg-white hover:shadow-md hover:shadow-brand/5"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-slate-900">{svc.name}</p>
                          <p className="text-[11px] text-slate-500">8 Hours standard full-day shift</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono text-base font-black text-emerald-700">
                              ₹{svc.price}
                            </span>
                            <span className="block text-[10px] text-slate-400">/day</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBookTrade(svc)}
                            className="lp-shine group/btn inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:shadow-md hover:shadow-brand/25 active:scale-95"
                          >
                            <span>Book</span>
                            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
                  <p className="font-semibold">Role-based booking enabled:</p>
                  <p className="mt-0.5 text-[11px] text-blue-800/80">
                    Customers book single trades for home tasks. Contractors can scale multi-person crews with daily attendance.
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  )
}
