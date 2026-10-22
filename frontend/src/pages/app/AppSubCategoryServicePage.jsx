import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  Wrench,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Award,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { getCategoryImageUrl } from '../../lib/labourCategoryDisplay.js'
import { BookingTypeSheet } from '../../components/app/booking/BookingTypeSheet.jsx'
import { readBookingDraft, writeBookingDraft } from '../../lib/individualBookingDraft.js'
import { buildBookingFlowPath } from '../../lib/bookingFlowNavigation.js'
import { fetchLabourCategoriesGrouped } from '../../api/labourCategoriesApi.js'
import { readAppUserLocation } from '../../lib/appUserLocationStorage.js'

function getFeatureIcon(text = '', index = 0) {
  const lower = String(text).toLowerCase()
  if (lower.includes('staff') || lower.includes('trained') || lower.includes('professional') || lower.includes('worker') || lower.includes('team')) {
    return UserCheck
  }
  if (lower.includes('time') || lower.includes('punctual') || lower.includes('hour') || lower.includes('quick') || lower.includes('fast') || lower.includes('sched')) {
    return Clock
  }
  if (lower.includes('safe') || lower.includes('hygien') || lower.includes('protect') || lower.includes('secure') || lower.includes('clean') || lower.includes('sanit')) {
    return ShieldCheck
  }
  if (lower.includes('quality') || lower.includes('certif') || lower.includes('expert') || lower.includes('guarantee')) {
    return Award
  }
  const fallbackIcons = [UserCheck, Clock, ShieldCheck, Sparkles, Award]
  return fallbackIcons[index % fallbackIcons.length]
}

export function AppSubCategoryServicePage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [expandedServiceId, setExpandedServiceId] = useState(null)
  const [selectedSlotByService, setSelectedSlotByService] = useState({})
  const [serviceTabs, setServiceTabs] = useState({})
  const [bookingTypeOpen, setBookingTypeOpen] = useState(false)
  const [bookingService, setBookingService] = useState(null)
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null)
  
  const [cat, setCat] = useState(() => location.state?.cat)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loc = readAppUserLocation()
    setLoading(true)
    fetchLabourCategoriesGrouped(loc?.lat, loc?.lng, loc?.city, loc?.address)
      .then(res => {
        if (cancelled) return
        const groups = res.data?.groups || []
        for (const g of groups) {
          for (const c of (g.categories || [])) {
            if (String(c._id) === String(id) || String(c._id) === String(cat?._id)) {
              setCat({ ...c, groupId: g._id, groupName: g.name, services: c.services || [] })
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, cat?._id])


  const handleStartBooking = (service, slot) => {
    setBookingService({ service, slot })
    setBookingTypeOpen(true)
  }

  const handleQuickBookType = useCallback(
    (bookingType) => {
      if (!bookingService?.service || !cat) return
      const { service, slot } = bookingService
      const prev = readBookingDraft() || {}
      
      const durationMins = slot ? Number(slot.minutes) : ((service.minHours || 1) * 60)
      const durationHours = durationMins / 60
      const rawPrice = slot?.price != null ? Number(slot.price) : Math.round(durationHours * (service.hourlyPrice || 0))
      const effectivePrice = slot?.discountedPrice != null ? Number(slot.discountedPrice) : rawPrice
      const slotLabel = slot?.label || (durationHours === 1 ? '1 Hour' : `${durationHours} Hours`)

      const serviceData = {
        _id: String(service._id),
        name: service.name,
        durationPricing: Array.isArray(service.durationPricing) ? service.durationPricing : [],
        zones: Array.isArray(service.zones) ? service.zones : [],
        hourlyPrice: service.hourlyPrice,
        basePrice: service.basePrice,
        minHours: service.minHours,
        maxHours: service.maxHours,
      }

      writeBookingDraft({
        ...prev,
        entryPoint: 'category',
        groupId: String(cat.groupId || ''),
        groupName: cat.groupName || '',
        categoryId: String(cat._id),
        categoryName: cat.name || '',
        serviceId: String(service._id),
        serviceName: service.name || '',
        service: serviceData,
        durationPricing: serviceData.durationPricing,
        bookingType,
        matchMode: 'smart',
        selectedWorkers: [],
        minHours: service.minHours || 1,
        maxHours: service.maxHours || 24,
        durationMinutes: durationMins,
        selectedSlotLabel: slotLabel,
        slotPrice: effectivePrice,
        baseSlotPrice: rawPrice,
        slotDiscountValue: slot?.discountValue || 0,
        slotDiscountType: slot?.discountType || 'PERCENTAGE',
        hours: durationHours,
      })
      setBookingTypeOpen(false)
      setBookingService(null)
      navigate(buildBookingFlowPath('details', { categoryId: cat._id }))
    },
    [navigate, cat, bookingService]
  )

  if (!cat && !loading) {
    // If user refreshes or visits directly, redirect back
    return <Navigate to="/app" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-slate-500">Loading services...</p>
      </div>
    )
  }

  const services = cat?.services || []

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 -mx-4 -mt-[max(0.5rem,env(safe-area-inset-top,0px))]">
      {/* Header */}
      <div className="sticky top-[max(0.5rem,env(safe-area-inset-top,0.5rem))] z-30 px-4 pt-2 pb-1 bg-slate-50/80 backdrop-blur-md">
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => navigate(-1)}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] border border-slate-200 text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="text-[20px] font-bold tracking-tight text-slate-900 leading-none truncate">{cat.name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        <section>
          {cat.subtitle ? (
            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              {cat.subtitle}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">No description available for this sub-category.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 pl-1">
            Available Services
          </h2>

          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Wrench className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No services found for your selected location.</p>
              <p className="text-xs text-slate-400 mt-1">Please try changing your location or check back later.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => {
                const isExpanded = expandedServiceId === service._id
                const featuresList = Array.isArray(service.features) ? service.features.map(f => String(f).trim()).filter(Boolean) : []
                const providesList = Array.isArray(service.whatWeProvide) ? service.whatWeProvide.map(f => String(f).trim()).filter(Boolean) : []
                const dontProvidesList = Array.isArray(service.whatWeDontProvide) ? service.whatWeDontProvide.map(f => String(f).trim()).filter(Boolean) : []

                const availableTabs = [
                  featuresList.length > 0 && { id: 'features', label: 'Features', count: featuresList.length, icon: Sparkles, color: 'blue' },
                  providesList.length > 0 && { id: 'provide', label: 'What We Provide', count: providesList.length, icon: CheckCircle2, color: 'emerald' },
                  dontProvidesList.length > 0 && { id: 'dont_provide', label: "What We Don't Provide", count: dontProvidesList.length, icon: XCircle, color: 'rose' },
                ].filter(Boolean)

                const activeTab = availableTabs.some(t => t.id === serviceTabs[service._id])
                  ? serviceTabs[service._id]
                  : (availableTabs[0]?.id || null)

                const activeSlots = (Array.isArray(service.durationPricing) ? service.durationPricing : [])
                  .filter(dp => dp && Number(dp.minutes) > 0 && dp.isActive !== false)
                  .sort((a, b) => a.minutes - b.minutes)

                const selectedSlotMinutes = selectedSlotByService[service._id] ?? (activeSlots[0]?.minutes ?? null)
                const selectedSlot = activeSlots.find(s => s.minutes === selectedSlotMinutes) || activeSlots[0] || null

                const discountBadgeText = Number(service.discountValue) > 0
                  ? (service.discountType === 'FIXED' ? `₹${service.discountValue} OFF` : `${service.discountValue}% OFF`)
                  : null

                return (
                  <div
                    key={service._id}
                    className={`bg-white rounded-3xl shadow-sm border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-blue-500/40 ring-1 ring-blue-500/20 shadow-md'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Collapsed Header */}
                    {!isExpanded && (
                      <button
                        type="button"
                        onClick={() => setExpandedServiceId(service._id)}
                        className="w-full p-3.5 flex items-center gap-3.5 text-left transition hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-slate-900 shadow-inner relative">
                          <img
                            src={getCategoryImageUrl({ name: service.name, imageUrl: service.iconUrl })}
                            alt={service.name}
                            className="h-full w-full min-w-full block object-cover object-center scale-110"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-900 truncate text-sm">{service.name}</h3>
                            {discountBadgeText && (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                                {discountBadgeText}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold text-blue-600 mt-0.5 truncate">{cat.name}</p>
                          {service.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{service.description}</p>
                          )}
                        </div>

                        <div className="shrink-0 text-right flex items-center gap-2 pr-1">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Price</p>
                            <p className="font-mono text-sm font-bold text-blue-600 mt-0.5">
                              {activeSlots.length > 0 ? `₹${activeSlots[0].price}` : `₹${service.hourlyPrice}/hr`}
                            </p>
                          </div>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      </button>
                    )}

                    {/* Expanded Layout Matching Image 2 */}
                    {isExpanded && (
                      <div>
                        {/* 1. Large Image Banner */}
                        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900 rounded-t-3xl">
                          <img
                            src={getCategoryImageUrl({ name: service.name, imageUrl: service.iconUrl })}
                            alt={service.name}
                            className="h-full w-full min-w-full block object-cover object-center scale-115 transform transition-transform duration-300"
                          />
                          {/* Collapse button */}
                          <button
                            type="button"
                            onClick={() => setExpandedServiceId(null)}
                            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition shadow-sm cursor-pointer z-10"
                            title="Collapse"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4">
                          {/* 2. Service Name & Sub-Category */}
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                                  {service.name}
                                </h3>
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                                  {cat.name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setExpandedServiceId(null)}
                                className="shrink-0 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                title="Collapse service"
                              >
                                <ChevronUp className="h-5 w-5" />
                              </button>
                            </div>

                            {/* 3. Description */}
                            {service.description && (
                              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2">
                                {service.description}
                              </p>
                            )}
                          </div>

                          {/* 4. Timing & Pricing with Discount Badge */}
                          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                Select Timing & Price
                              </span>
                              {discountBadgeText && (
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs tracking-tight">
                                  {discountBadgeText}
                                </span>
                              )}
                            </div>

                            {activeSlots.length > 0 ? (
                              <div className="grid gap-2">
                                {activeSlots.map((slot) => {
                                  const isSelected = selectedSlotMinutes === slot.minutes
                                  const originalPrice = Number(slot.price) || 0
                                  const discVal = Number(slot.discountValue) || 0
                                  const discType = slot.discountType || 'PERCENTAGE'
                                  const discAmt = discVal > 0 ? (discType === 'FIXED' ? discVal : Math.round((originalPrice * discVal) / 100)) : 0
                                  const finalPrice = slot.discountedPrice != null ? Number(slot.discountedPrice) : Math.max(0, originalPrice - discAmt)
                                  const hasDiscount = discAmt > 0

                                  return (
                                    <button
                                      key={slot.minutes}
                                      type="button"
                                      onClick={() => setSelectedSlotByService(prev => ({ ...prev, [service._id]: slot.minutes }))}
                                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                        isSelected
                                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/30'
                                          : 'border-slate-200 bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 flex-wrap">
                                        <Clock className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className="font-extrabold text-blue-700 text-sm sm:text-base">
                                          ₹ {finalPrice}
                                        </span>
                                        {hasDiscount && (
                                          <span className="text-xs font-semibold text-slate-400 line-through">
                                            ₹ {originalPrice}
                                          </span>
                                        )}
                                        {hasDiscount && (
                                          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-extrabold">
                                            {discType === 'FIXED' ? `₹${discVal} OFF` : `${discVal}% OFF`}
                                          </span>
                                        )}
                                        <span className="text-xs font-semibold text-slate-600">
                                          / {slot.label || (slot.minutes >= 60 ? `${slot.minutes / 60} hr` : `${slot.minutes} min`)}
                                        </span>
                                      </div>
                                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                      }`}>
                                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-2.5">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-extrabold text-blue-700 text-sm sm:text-base">
                                    ₹ {service.hourlyPrice}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-600">
                                    {service.minHours === 0.5 ? '/ 30 min' : '/ hr'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 5. Features, What We Provide, What We Don't Provide Tabs & Stacked Pills (Dynamic Admin Data Only) */}
                          {availableTabs.length > 0 && activeTab && (
                            <div className="space-y-2.5 pt-0.5">
                              {/* Segmented Pill Tabs */}
                              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto no-scrollbar">
                                {availableTabs.map((tab) => {
                                  const isTabActive = activeTab === tab.id
                                  const TabIcon = tab.icon
                                  return (
                                    <button
                                      key={tab.id}
                                      type="button"
                                      onClick={() => setServiceTabs(prev => ({ ...prev, [service._id]: tab.id }))}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        isTabActive
                                          ? tab.color === 'emerald'
                                            ? 'bg-white text-emerald-700 shadow-xs'
                                            : tab.color === 'rose'
                                            ? 'bg-white text-rose-700 shadow-xs'
                                            : 'bg-white text-blue-700 shadow-xs'
                                          : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      <TabIcon className={`h-3.5 w-3.5 ${
                                        tab.color === 'emerald' ? 'text-emerald-600' : tab.color === 'rose' ? 'text-rose-600' : 'text-blue-600'
                                      }`} />
                                      <span>{tab.label}</span>
                                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isTabActive
                                          ? tab.color === 'emerald'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : tab.color === 'rose'
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-blue-50 text-blue-700'
                                          : 'bg-slate-300/70 text-slate-700'
                                      }`}>
                                        {tab.count}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>

                              {/* Stacked Pill Rows */}
                              <div className="space-y-2">
                                {activeTab === 'features' && featuresList.map((item, idx) => {
                                  const IconComp = getFeatureIcon(item, idx)
                                  return (
                                    <div
                                      key={idx}
                                      className="rounded-2xl border border-blue-100 bg-blue-50/25 p-2.5 flex items-center gap-3 transition-all hover:bg-blue-50/50 shadow-2xs"
                                    >
                                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                                        <IconComp className="h-4 w-4" />
                                      </div>
                                      <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                        {item}
                                      </span>
                                    </div>
                                  )
                                })}

                                {activeTab === 'provide' && providesList.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-2.5 flex items-center gap-3 transition-all hover:bg-emerald-50/50 shadow-2xs"
                                  >
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                                      <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                      {item}
                                    </span>
                                  </div>
                                ))}

                                {activeTab === 'dont_provide' && dontProvidesList.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-2xl border border-rose-100 bg-rose-50/25 p-2.5 flex items-center gap-3 transition-all hover:bg-rose-50/50 shadow-2xs"
                                  >
                                    <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
                                      <XCircle className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                      {item}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 5b. Service Showcase Gallery (Multiple Images Uploaded by Admin) Just Above Book Now */}
                          {Array.isArray(service.images) && service.images.length > 0 && (
                            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                              {/* Header strictly in a single clean line */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                                    Real Work Showcase
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap shrink-0">
                                    {service.images.length}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedLightboxImage({ url: service.images[0], index: 0, all: service.images })}
                                  className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  <span>View all</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Showcase Photos Carousel */}
                              <div className="flex gap-2.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar snap-x snap-mandatory">
                                {service.images.map((imgUrl, imgIdx) => (
                                  <button
                                    key={imgIdx}
                                    type="button"
                                    onClick={() => setSelectedLightboxImage({ url: imgUrl, index: imgIdx, all: service.images })}
                                    className="relative shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-500 hover:shadow-md transition-all w-32 sm:w-40 aspect-4/3 cursor-pointer group text-left"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`${service.name} work sample ${imgIdx + 1}`}
                                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      loading="lazy"
                                      onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                      {imgIdx + 1}/{service.images.length}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 6. "Book Now >" Action Button matching Image 2 */}
                          <button
                            type="button"
                            onClick={() => handleStartBooking(service, selectedSlot)}
                            className="w-full mt-2 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Book Now</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <BookingTypeSheet
        open={bookingTypeOpen}
        onClose={() => {
          setBookingTypeOpen(false)
          setBookingService(null)
        }}
        value={null}
        categoryLabel={bookingService?.service?.name || cat?.name}
        onSelect={handleQuickBookType}
      />

      {/* Service Image Lightbox Modal */}
      {selectedLightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedLightboxImage(null)}
          />

          <div className="relative z-10 max-w-3xl w-full flex flex-col items-center">
            {/* Top Bar with counter & close */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>Real Work Showcase · {selectedLightboxImage.index + 1} of {selectedLightboxImage.all.length}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedLightboxImage(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black max-h-[75vh] w-full flex items-center justify-center shadow-2xl">
              <img
                src={selectedLightboxImage.url}
                alt={`Service Preview ${selectedLightboxImage.index + 1}`}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />

              {/* Prev / Next navigation buttons */}
              {selectedLightboxImage.index > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = selectedLightboxImage.index - 1
                    setSelectedLightboxImage({
                      url: selectedLightboxImage.all[prevIdx],
                      index: prevIdx,
                      all: selectedLightboxImage.all,
                    })
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs cursor-pointer"
                  title="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {selectedLightboxImage.index < selectedLightboxImage.all.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = selectedLightboxImage.index + 1
                    setSelectedLightboxImage({
                      url: selectedLightboxImage.all[nextIdx],
                      index: nextIdx,
                      all: selectedLightboxImage.all,
                    })
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs cursor-pointer"
                  title="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
