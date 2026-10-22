import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Clock, MapPin, Sparkles, UserCheck, Wrench } from 'lucide-react'
import { createEmptyDraft, writeBookingDraft } from '../../lib/individualBookingDraft.js'
import { fetchLabourCategoriesGrouped } from '../../api/labourCategoriesApi.js'
import { DB_CATEGORIES, DB_ZONES } from '../../data/dbServicesSeed.js'

// Authentic categories from project with starting base rates
const REAL_CATEGORIES = [
  {
    id: '6a7b0f75d7b2d517ea3b42fd',
    name: 'Masonry & Construction',
    slug: 'masonry-construction',
    hourly: 115,
    halfDay: 460,
    fullDay: 850,
  },
  {
    id: '6a7b0f76d7b2d517ea3b4316',
    name: 'Plumbing',
    slug: 'plumbing',
    hourly: 200,
    halfDay: 600,
    fullDay: 1100,
  },
  {
    id: '6a7b0f77d7b2d517ea3b432c',
    name: 'Electrical',
    slug: 'electrical-services',
    hourly: 250,
    halfDay: 650,
    fullDay: 1200,
  },
  {
    id: '6a7b0f78d7b2d517ea3b4342',
    name: 'Air Conditioning & Cooling',
    slug: 'air-conditioning-cooling',
    hourly: 300,
    halfDay: 750,
    fullDay: 1350,
  },
  {
    id: '6a7b0f78d7b2d517ea3b4355',
    name: 'Painting & Wall Finishing',
    slug: 'painting-wall-finishing',
    hourly: 200,
    halfDay: 500,
    fullDay: 950,
  },
  {
    id: '6a7b0f7ad7b2d517ea3b438f',
    name: 'Housekeeping',
    slug: 'housekeeping-home-cleaning',
    hourly: 89,
    halfDay: 350,
    fullDay: 650,
  },
  {
    id: '6a7b0f7cd7b2d517ea3b43bd',
    name: 'Cook Services',
    slug: 'cook-food-services',
    hourly: 500,
    halfDay: 900,
    fullDay: 1500,
  },
  {
    id: '6a7b0f7cd7b2d517ea3b43ce',
    name: 'Loader & Moving Services',
    slug: 'loader-moving-services',
    hourly: 250,
    halfDay: 600,
    fullDay: 1050,
  },
]

const SHIFTS = [
  { id: '1hr', label: '1 - 2 Hours', minutes: 60, key: 'hourly', badge: 'Standard 1h' },
  { id: '4hr', label: '4 Hours (Half Day)', minutes: 240, key: 'halfDay', badge: 'Save 10%' },
  { id: '8hr', label: '8 Hours (Full Day)', minutes: 480, key: 'fullDay', badge: 'Best Value' },
]

export function QuickBookingWidget({ onBook }) {
  const navigate = useNavigate()
  const [roleMode, setRoleMode] = useState('customer') // 'customer' | 'contractor'
  const [categoriesList, setCategoriesList] = useState(REAL_CATEGORIES)
  const [selectedCatId, setSelectedCatId] = useState(REAL_CATEGORIES[0].id)
  const [selectedShift, setSelectedShift] = useState('1hr') // Default to 1 hr as requested
  const [city, setCity] = useState(DB_ZONES.find((z) => z.city === 'Indore')?.city || DB_ZONES[0].city)

  // Sync live categories from backend API if available
  useEffect(() => {
    fetchLabourCategoriesGrouped(null, null, city)
      .then((res) => {
        const groups = res.data?.groups || []
        if (groups && groups.length > 0) {
          const mapped = groups.slice(0, 8).map((g) => {
            const fallback = REAL_CATEGORIES.find((rc) => rc.slug === g.slug || rc.name === g.name)
            return {
              id: g._id,
              name: g.name,
              slug: g.slug,
              hourly: fallback?.hourly || 200,
              halfDay: fallback?.halfDay || 600,
              fullDay: fallback?.fullDay || 1100,
            }
          })
          if (mapped.length > 0) {
            setCategoriesList(mapped)
          }
        }
      })
      .catch(() => {})
  }, [city])

  const categoryObj = categoriesList.find((c) => c.id === selectedCatId) || categoriesList[0]
  const shiftObj = SHIFTS.find((s) => s.id === selectedShift) || SHIFTS[0]
  const estimatedPrice = categoryObj[shiftObj.key] || categoryObj.hourly

  function handleQuickBook(e) {
    e.preventDefault()

    const draft = {
      ...createEmptyDraft(),
      entryPoint: 'category',
      groupId: categoryObj.id,
      groupName: categoryObj.name,
      categoryName: categoryObj.name,
      serviceName: `${categoryObj.name} Service`,
      address: city,
      durationMinutes: shiftObj.minutes,
      selectedSlotLabel: shiftObj.label,
      slotPrice: estimatedPrice,
      durationKind: shiftObj.minutes >= 480 ? 'full_day' : 'few_hours',
      notes: roleMode === 'contractor' ? 'Contractor commercial workforce booking' : '',
    }
    writeBookingDraft(draft)

    if (onBook) {
      onBook(draft)
    } else {
      navigate(`/app/booking/flow?step=details&groupId=${categoryObj.id}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5"
    >
      {/* Role Selection Tabs */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1 mb-4">
        <button
          type="button"
          onClick={() => setRoleMode('customer')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            roleMode === 'customer'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Customer (Individual)
        </button>
        <button
          type="button"
          onClick={() => setRoleMode('contractor')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            roleMode === 'contractor'
              ? 'bg-white text-brand shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Contractor (Workforce)
        </button>
      </div>

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Wrench className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
              {roleMode === 'contractor' ? 'Contractor Workforce Booking' : 'Instant Service Booking'}
            </h3>
            <p className="text-[11px] text-slate-500">Verified professionals • Zero advance fee</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Workers Ready
        </span>
      </div>

      <form onSubmit={handleQuickBook} className="mt-4 space-y-4">
        {/* Step 1: Real Category Selection */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>1. Select Service Category</span>
            <span className="text-[10px] text-brand lowercase">({categoriesList.length} categories available)</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categoriesList.map((cat) => {
              const active = cat.id === selectedCatId
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex flex-col items-start rounded-xl border p-2 text-left transition-all ${
                    active
                      ? 'border-brand bg-brand/5 ring-2 ring-brand/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-bold leading-tight ${active ? 'text-brand' : 'text-slate-800'}`}>
                    {cat.name}
                  </span>
                  <span className="mt-1 font-mono text-[10px] font-bold text-emerald-700">
                    from ₹{cat.hourly}/hr
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Shift Duration (Defaulted to 1 Hr) */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>2. Select Time Required</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" /> Same day arrival
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SHIFTS.map((shift) => {
              const active = shift.id === selectedShift
              return (
                <button
                  type="button"
                  key={shift.id}
                  onClick={() => setSelectedShift(shift.id)}
                  className={`relative flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all ${
                    active
                      ? 'border-brand bg-brand text-white shadow-md shadow-brand/25 ring-2 ring-brand/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold">{shift.label}</span>
                  <span
                    className={`mt-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {shift.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 3: City and Upfront Price */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <MapPin className="h-3 w-3 text-slate-400" /> City / Service Zone
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
            >
              {DB_ZONES.map((z) => (
                <option key={z.id} value={z.city}>
                  {z.city} ({z.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
              Upfront Standard Price
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700">₹{estimatedPrice}</span>
              <span className="text-[11px] font-semibold text-emerald-800/80">
                / {shiftObj.id === '8hr' ? '8 hrs day' : shiftObj.id === '4hr' ? '4 hrs' : '1 hr'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700/80">Pay After Work • Zero Advance Fee</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-bright to-brand py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-105 active:scale-[0.99]"
        >
          <span>Book {categoryObj.name} Now</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      {/* Trust Micro-Badges */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5 text-brand" /> Aadhaar KYC Verified
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Free Replacement
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 45 Min Fast Arrival
        </span>
      </div>
    </motion.div>
  )
}
