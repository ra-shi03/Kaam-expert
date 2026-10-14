import { useCallback, useEffect, useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Search, RefreshCw, Edit2, Trash2, Wrench, Eye, X, AlertTriangle, ChevronDown, ChevronUp, Clock, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import {
  fetchAdminLabourCategoryTree,
  createAdminLabourService,
  updateAdminLabourService,
  deleteAdminLabourService,
  getAdminLabourServiceById,
} from '../../api/adminLabourCategoriesApi.js'
import { adminZonesApi } from '../../api/adminZonesApi.js'
import { adminSettingsApi } from '../../api/adminSettingsApi.js'
import { ApiError } from '../../api/http.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { SearchableSelect } from '../../components/ui/SearchableSelect.jsx'
import { MultiSearchableSelect } from '../../components/ui/MultiSearchableSelect.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { getCategoryImageUrl } from '../../lib/labourCategoryDisplay.js'
import { UPLOAD_FOLDERS } from '../../constants/uploadFolders.js'
import { assetUrlFromUpload, uploadMedia } from '../../api/uploadApi.js'

export function getMergedDurationSlots(globalOptions = [], durationPricing = []) {
  const map = new Map()
  globalOptions.forEach(opt => {
    map.set(opt.minutes, { minutes: opt.minutes, label: opt.label, tag: opt.tag, isGlobal: true })
  })
  durationPricing.forEach(dp => {
    if (dp && dp.minutes > 0 && !map.has(dp.minutes)) {
      map.set(dp.minutes, { minutes: dp.minutes, label: dp.label || `${dp.minutes} min`, tag: dp.tag, isGlobal: false })
    }
  })
  return Array.from(map.values()).sort((a, b) => a.minutes - b.minutes)
}

function DurationPricingEditor({ globalOptions = [], durationPricing = [], setDurationPricing, baseHourlyPrice = 0 }) {
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customHours, setCustomHours] = useState('')
  const [customMins, setCustomMins] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [customPrice, setCustomPrice] = useState('')

  const mergedOptions = useMemo(
    () => getMergedDurationSlots(globalOptions, durationPricing),
    [globalOptions, durationPricing]
  )

  const handlePriceChange = (minutes, newPrice) => {
    setDurationPricing(prev => {
      const idx = prev.findIndex(p => p.minutes === minutes)
      const val = Math.max(0, parseFloat(newPrice) || 0)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], price: val }
        return updated
      }
      const opt = mergedOptions.find(g => g.minutes === minutes)
      return [...prev, { minutes, label: opt?.label, tag: opt?.tag, price: val, isActive: true }]
    })
  }

  const handleActiveToggle = (minutes, isActive) => {
    setDurationPricing(prev => {
      const idx = prev.findIndex(p => p.minutes === minutes)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], isActive }
        return updated
      }
      const opt = mergedOptions.find(g => g.minutes === minutes)
      return [...prev, { minutes, label: opt?.label, tag: opt?.tag, price: 0, isActive }]
    })
  }

  const handleRemoveSlot = (minutes) => {
    setDurationPricing(prev => prev.filter(p => p.minutes !== minutes))
  }

  const handleAutoFill = () => {
    const hourly = parseFloat(baseHourlyPrice) || 0
    if (!hourly) return
    const filled = mergedOptions.map(opt => {
      const existing = durationPricing.find(p => p.minutes === opt.minutes)
      const calculatedPrice = Math.round(hourly * (opt.minutes / 60))
      return {
        minutes: opt.minutes,
        label: opt.label,
        tag: opt.tag,
        price: existing?.price && existing.price > 0 ? existing.price : calculatedPrice,
        isActive: existing ? existing.isActive : true,
      }
    })
    setDurationPricing(filled)
  }

  const handleAddCustomSlot = (e) => {
    e.preventDefault()
    const hrs = parseInt(customHours) || 0
    const mins = parseInt(customMins) || 0
    const totalMinutes = hrs * 60 + mins
    if (totalMinutes <= 0) return

    let label = customLabel.trim()
    if (!label) {
      if (hrs > 0 && mins > 0) label = `${hrs} hr ${mins} min`
      else if (hrs > 0) label = `${hrs} hr`
      else label = `${mins} min`
    }

    const price = Math.max(0, parseFloat(customPrice) || 0)

    setDurationPricing(prev => {
      const existingIdx = prev.findIndex(p => p.minutes === totalMinutes)
      if (existingIdx >= 0) {
        const next = [...prev]
        next[existingIdx] = { ...next[existingIdx], label, price, isActive: true }
        return next
      }
      return [...prev, { minutes: totalMinutes, label, tag: null, price, isActive: true }].sort((a, b) => a.minutes - b.minutes)
    })

    setCustomHours('')
    setCustomMins('')
    setCustomLabel('')
    setCustomPrice('')
    setShowAddCustom(false)
  }

  return (
    <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-700">
            Duration-Based Pricing (Dynamic Service Time)
          </label>
          <p className="text-[11px] text-slate-500">
            Set exact custom prices for duration slots. Add custom time slots or auto-fill from base hourly rate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="flex items-center gap-1 rounded-lg border border-brand bg-brand px-2.5 py-1 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {showAddCustom ? 'Close' : 'Add Time Slot'}
          </button>
          <button
            type="button"
            onClick={handleAutoFill}
            className="rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand/10 transition"
          >
            Auto-fill from Base Rate
          </button>
        </div>
      </div>

      {showAddCustom && (
        <form onSubmit={handleAddCustomSlot} className="rounded-xl border border-brand/20 bg-brand/5 p-3 space-y-2">
          <div className="text-xs font-bold text-slate-800">Add New Dynamic Time Slot</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                placeholder="0"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="15"
                value={customMins}
                onChange={(e) => setCustomMins(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 1 hr 15 min"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Price (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-brand"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white hover:bg-brand/90"
            >
              Save Slot
            </button>
          </div>
        </form>
      )}

      <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2 w-36">Price (₹)</th>
              <th className="px-3 py-2 w-20 text-center">Enabled</th>
              <th className="px-2 py-2 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {mergedOptions.map(opt => {
              const current = durationPricing.find(p => p.minutes === opt.minutes)
              const price = current?.price ?? ''
              const isActive = current?.isActive ?? true
              const isSpecial = opt.tag === 'half_day' || opt.tag === 'full_day'

              return (
                <tr key={opt.minutes} className={`hover:bg-slate-50/60 ${isSpecial ? 'bg-emerald-50/30' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{opt.label}</span>
                      {isSpecial && (
                        <span className="text-[9px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                          {opt.tag === 'half_day' ? 'Half Day' : 'Full Day'}
                        </span>
                      )}
                      {!opt.isGlobal && (
                        <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        placeholder={baseHourlyPrice ? String(Math.round(baseHourlyPrice * (opt.minutes / 60))) : '0'}
                        onChange={(e) => handlePriceChange(opt.minutes, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-brand"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => handleActiveToggle(opt.minutes, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/35 cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(opt.minutes)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                      title="Remove this slot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ZonePricingEditor({
  zones = [],
  setZones,
  activeZones = [],
  availableSlots = [],
  baseHourlyPrice = 0,
}) {
  const [expandedZoneIdx, setExpandedZoneIdx] = useState(null)

  const handleAddZone = () => {
    setZones(prev => [...prev, { zone: '', price: 0, isActive: true, durationPricing: [] }])
  }

  const handleRemoveZone = (idx) => {
    setZones(prev => prev.filter((_, i) => i !== idx))
    if (expandedZoneIdx === idx) setExpandedZoneIdx(null)
  }

  const handleZoneChange = (idx, field, value) => {
    setZones(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const handleZoneSlotPriceChange = (zoneIdx, minutes, price, opt) => {
    setZones(prev => {
      const next = [...prev]
      const currentZone = { ...next[zoneIdx] }
      const slots = Array.isArray(currentZone.durationPricing) ? [...currentZone.durationPricing] : []
      const idx = slots.findIndex(s => s.minutes === minutes)
      const numPrice = Math.max(0, parseFloat(price) || 0)
      if (idx >= 0) {
        slots[idx] = { ...slots[idx], price: numPrice }
      } else {
        slots.push({
          minutes,
          label: opt.label || `${minutes} min`,
          tag: opt.tag || null,
          price: numPrice,
          isActive: true,
        })
      }
      currentZone.durationPricing = slots
      next[zoneIdx] = currentZone
      return next
    })
  }

  const handleZoneSlotActiveToggle = (zoneIdx, minutes, isActive, opt) => {
    setZones(prev => {
      const next = [...prev]
      const currentZone = { ...next[zoneIdx] }
      const slots = Array.isArray(currentZone.durationPricing) ? [...currentZone.durationPricing] : []
      const idx = slots.findIndex(s => s.minutes === minutes)
      if (idx >= 0) {
        slots[idx] = { ...slots[idx], isActive }
      } else {
        slots.push({
          minutes,
          label: opt.label || `${minutes} min`,
          tag: opt.tag || null,
          price: 0,
          isActive,
        })
      }
      currentZone.durationPricing = slots
      next[zoneIdx] = currentZone
      return next
    })
  }

  const handleAutoFillZone = (zoneIdx) => {
    const currentZone = zones[zoneIdx]
    const hourly = parseFloat(currentZone.price) || parseFloat(baseHourlyPrice) || 0
    if (!hourly) return
    const filled = availableSlots.map(opt => {
      const existing = (currentZone.durationPricing || []).find(p => p.minutes === opt.minutes)
      const calculated = Math.round(hourly * (opt.minutes / 60))
      return {
        minutes: opt.minutes,
        label: opt.label,
        tag: opt.tag,
        price: existing?.price && existing.price > 0 ? existing.price : calculated,
        isActive: existing ? existing.isActive : true,
      }
    })
    setZones(prev => {
      const next = [...prev]
      next[zoneIdx] = { ...next[zoneIdx], durationPricing: filled }
      return next
    })
  }

  return (
    <div className="col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-700">
            Zone Availability & Zone-Wise Time Pricing
          </label>
          <p className="text-[11px] text-slate-500">
            Set zone hourly rates and custom prices for each duration slot per zone.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddZone}
          className="flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand/10 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 bg-slate-50/50">
          No zone-specific pricing added yet. Base service rate applies to all zones.
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zoneItem, idx) => {
            const isExpanded = expandedZoneIdx === idx
            const zoneId = typeof zoneItem.zone === 'object' ? zoneItem.zone._id : (zoneItem.zone || '')
            const configuredSlotCount = (zoneItem.durationPricing || []).filter(s => s.price > 0).length

            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={zoneId}
                      onChange={(e) => handleZoneChange(idx, 'zone', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand/35 bg-white"
                    >
                      <option value="">Select Zone</option>
                      {activeZones.map(z => (
                        <option key={z._id} value={z._id}>{z.name} ({z.city})</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹/hr</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Hourly Rate"
                        value={zoneItem.price ?? ''}
                        onChange={(e) => handleZoneChange(idx, 'price', Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-2 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand/35"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedZoneIdx(isExpanded ? null : idx)}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition border ${
                      isExpanded
                        ? 'bg-brand text-white border-brand'
                        : configuredSlotCount > 0
                        ? 'bg-brand/10 text-brand border-brand/20'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Configure individual duration prices for this zone"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Times ({configuredSlotCount}/{availableSlots.length})</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveZone(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    title="Remove Zone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-700">
                          Zone Time Slots (Showing All Times)
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Set exact custom price for this zone for each duration slot.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoFillZone(idx)}
                        className="rounded-lg border border-brand/30 bg-brand/5 px-2 py-1 text-[11px] font-bold text-brand hover:bg-brand/10 transition"
                      >
                        Auto-fill from Zone Rate
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-1.5">Duration</th>
                            <th className="px-3 py-1.5 w-32">Zone Price (₹)</th>
                            <th className="px-3 py-1.5 w-20 text-center">Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {availableSlots.map(opt => {
                            const current = (zoneItem.durationPricing || []).find(p => p.minutes === opt.minutes)
                            const price = current?.price ?? ''
                            const isActive = current?.isActive ?? true
                            const isSpecial = opt.tag === 'half_day' || opt.tag === 'full_day'
                            const fallbackCalc = zoneItem.price ? Math.round(zoneItem.price * (opt.minutes / 60)) : 0

                            return (
                              <tr key={opt.minutes} className={`hover:bg-slate-50/60 ${isSpecial ? 'bg-emerald-50/30' : ''}`}>
                                <td className="px-3 py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800">{opt.label}</span>
                                    {isSpecial && (
                                      <span className="text-[9px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                                        {opt.tag === 'half_day' ? 'Half Day' : 'Full Day'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-1">
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={price}
                                      placeholder={fallbackCalc ? String(fallbackCalc) : '0'}
                                      onChange={(e) => handleZoneSlotPriceChange(idx, opt.minutes, e.target.value, opt)}
                                      className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-brand"
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-1 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => handleZoneSlotActiveToggle(idx, opt.minutes, e.target.checked, opt)}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand/35 cursor-pointer"
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BulletPointsEditor({ label, icon: Icon, iconColor, badgeStyle, items = [], onChange, placeholder }) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (!items.includes(trimmed)) {
      onChange([...items, trimmed])
    }
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleRemove = (indexToRemove) => {
    onChange(items.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {Icon && <Icon className={`h-3.5 w-3.5 ${iconColor || 'text-slate-500'}`} />}
          <span>{label}</span>
          <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
            {items.length}
          </span>
        </label>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Add a ${label.toLowerCase()} bullet point...`}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-1.5 pt-1">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${badgeStyle || 'border-slate-200 bg-white text-slate-700'}`}
            >
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${iconColor || 'text-slate-400'}`} />}
                <span className="font-medium break-words leading-tight">{item}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="shrink-0 p-0.5 text-slate-400 hover:text-rose-600 transition"
                title="Remove bullet point"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] italic text-slate-400 pl-0.5">No bullet points added yet.</p>
      )}
    </div>
  )
}

function AddServiceModal({ open, subcategories, activeZones = [], onClose, onSaved, busy, setBusy }) {
  const [name, setName] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState([])
  const [whatWeProvide, setWhatWeProvide] = useState([])
  const [whatWeDontProvide, setWhatWeDontProvide] = useState([])
  const [hourlyPrice, setHourlyPrice] = useState(0)
  const [minHours, setMinHours] = useState(1)
  const [maxHours, setMaxHours] = useState(24)
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState(0)
  const [zones, setZones] = useState([])
  const [iconUrl, setIconUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [error, setError] = useState('')
  const [durationOptions, setDurationOptions] = useState([])
  const [durationPricing, setDurationPricing] = useState([])

  useEffect(() => {
    if (open) {
      setName('')
      setSubcategoryId(subcategories[0]?._id ?? '')
      setDescription('')
      setFeatures([])
      setWhatWeProvide([])
      setWhatWeDontProvide([])
      setHourlyPrice(0)
      setMinHours(1)
      setMaxHours(24)
      setDiscountType('PERCENTAGE')
      setDiscountValue(0)
      setZones([])
      setIconUrl('')
      setIsActive(true)
      setError('')
      setDurationPricing([])
      adminSettingsApi.getDurationOptions().then((res) => {
        if (Array.isArray(res.data?.durationOptions)) {
          setDurationOptions(res.data.durationOptions)
        }
      }).catch(() => {})
    }
  }, [open, subcategories])

  const availableSlots = useMemo(
    () => getMergedDurationSlots(durationOptions, durationPricing),
    [durationOptions, durationPricing]
  )

  if (!open) return null

  async function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError('')
    setUploadBusy(true)
    try {
      const uploaded = await uploadMedia(file, UPLOAD_FOLDERS.LABOUR_CATEGORIES)
      const url = assetUrlFromUpload(uploaded)
      if (url) setIconUrl(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setUploadBusy(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !subcategoryId) {
      setError('Name and sub-category are required.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        subcategoryId,
        description: description.trim(),
        features,
        whatWeProvide,
        whatWeDontProvide,
        basePrice: Number(hourlyPrice), // Keep schema happy with basePrice = hourlyPrice
        hourlyPrice: Number(hourlyPrice),
        minHours: parseFloat(minHours) || 0.5,
        maxHours: Number(maxHours),
        discountType,
        discountValue: Number(discountValue),
        isAllZones: zones.length === activeZones.length,
        zones: zones
          .filter(z => (typeof z.zone === 'object' ? z.zone?._id : z.zone))
          .map(z => ({
            zone: typeof z.zone === 'object' ? z.zone?._id : z.zone,
            price: Number(z.price) || 0,
            isActive: z.isActive !== false,
            durationPricing: Array.isArray(z.durationPricing)
              ? z.durationPricing.filter(d => (Number(d.price) > 0 || d.isActive))
              : []
          })),
        durationPricing: durationPricing.filter(dp => (dp.price > 0 || dp.isActive)),
        iconUrl: iconUrl.trim() || undefined,
        isActive
      }
      await createAdminLabourService(payload)
      setBusy(false)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save service')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={() => !busy && !uploadBusy && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 px-5 py-4 flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-900">Add Service</h3>
          <button onClick={() => !busy && !uploadBusy && onClose()} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5 max-h-[85vh] overflow-y-auto">
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Sub-Category</label>
              <SearchableSelect
                value={subcategoryId}
                onChange={setSubcategoryId}
                options={subcategories.map(sc => ({ value: sc._id, label: `${sc.name} (${sc.categoryName})` }))}
                placeholder="Select a sub-category"
              />
            </div>
            
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
                placeholder="Optional description"
              />
            </div>

            {/* Bullet Points Section */}
            <div className="col-span-2 space-y-3 pt-1">
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Service Highlights & Details
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Add bullet points for features, what we provide, and what we don't provide.
                </p>
                <div className="space-y-3">
                  <BulletPointsEditor
                    label="Features"
                    icon={Sparkles}
                    iconColor="text-brand"
                    badgeStyle="border-indigo-100 bg-indigo-50/40 text-slate-800"
                    items={features}
                    onChange={setFeatures}
                    placeholder="e.g. Certified professionals, same-day service..."
                  />
                  <BulletPointsEditor
                    label="What We Provide"
                    icon={CheckCircle2}
                    iconColor="text-emerald-600"
                    badgeStyle="border-emerald-100 bg-emerald-50/40 text-slate-800"
                    items={whatWeProvide}
                    onChange={setWhatWeProvide}
                    placeholder="e.g. Standard tools, post-service cleanup..."
                  />
                  <BulletPointsEditor
                    label="What We Don't Provide"
                    icon={XCircle}
                    iconColor="text-rose-600"
                    badgeStyle="border-rose-100 bg-rose-50/40 text-slate-800"
                    items={whatWeDontProvide}
                    onChange={setWhatWeDontProvide}
                    placeholder="e.g. Spare parts/materials, civil alterations..."
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Price (₹)</label>
              <input
                type="number"
                min="0"
                value={hourlyPrice}
                onChange={(e) => setHourlyPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Min Hours <span className="normal-case font-normal text-slate-400">(0.5 = 30 min)</span></label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={minHours}
                onChange={(e) => setMinHours(parseFloat(e.target.value) || 0.5)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Max Hours</label>
              <input
                type="number"
                min="1"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35 bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                Discount {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <DurationPricingEditor
              globalOptions={durationOptions}
              durationPricing={durationPricing}
              setDurationPricing={setDurationPricing}
              baseHourlyPrice={hourlyPrice}
            />

            <ZonePricingEditor
              zones={zones}
              setZones={setZones}
              activeZones={activeZones}
              availableSlots={availableSlots}
              baseHourlyPrice={hourlyPrice}
            />

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/35"
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500">Icon</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-2 ring-slate-200">
                  {iconUrl ? (
                    <img src={getCategoryImageUrl({ name, imageUrl: iconUrl })} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-slate-400">None</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex gap-2">
                    <input type="file" accept="image/*" onChange={handleFilePick} className="hidden" id="add-svc-img" />
                    <label
                      htmlFor="add-svc-img"
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {uploadBusy ? 'Uploading...' : 'Upload'}
                    </label>
                    {iconUrl && (
                      <button
                        type="button"
                        onClick={() => setIconUrl('')}
                        className="text-[11px] font-bold text-rose-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="Or paste URL"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand/35"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => !busy && !uploadBusy && onClose()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <AppPrimaryButton type="submit" disabled={busy || uploadBusy} className="!w-auto px-6">
              {busy ? 'Creating...' : 'Create Service'}
            </AppPrimaryButton>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function EditServiceModal({ open, service, subcategories, activeZones = [], onClose, onSaved, busy, setBusy }) {
  const [name, setName] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState([])
  const [whatWeProvide, setWhatWeProvide] = useState([])
  const [whatWeDontProvide, setWhatWeDontProvide] = useState([])
  const [hourlyPrice, setHourlyPrice] = useState(0)
  const [minHours, setMinHours] = useState(1)
  const [maxHours, setMaxHours] = useState(24)
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState(0)
  const [zones, setZones] = useState([])
  const [iconUrl, setIconUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [error, setError] = useState('')
  const [durationOptions, setDurationOptions] = useState([])
  const [durationPricing, setDurationPricing] = useState([])

  useEffect(() => {
    if (open && service) {
      setName(service.name || '')
      setSubcategoryId(service.subcategoryId || (subcategories[0]?._id ?? ''))
      setDescription(service.description || '')
      setFeatures(Array.isArray(service.features) ? service.features : [])
      setWhatWeProvide(Array.isArray(service.whatWeProvide) ? service.whatWeProvide : [])
      setWhatWeDontProvide(Array.isArray(service.whatWeDontProvide) ? service.whatWeDontProvide : [])
      setHourlyPrice(service.hourlyPrice ?? 0)
      setMinHours(service.minHours ?? 1)
      setMaxHours(service.maxHours ?? 24)
      setDiscountType(service.discountType ?? 'PERCENTAGE')
      setDiscountValue(service.discountValue ?? 0)
      
      const safeZones = (service.zones ?? []).map(z => {
        if (typeof z === 'string') return { zone: z, price: service.hourlyPrice ?? 0, isActive: true, durationPricing: [] }
        return {
          zone: typeof z.zone === 'object' ? z.zone?._id : (z.zone || ''),
          price: z.price ?? service.hourlyPrice ?? 0,
          isActive: z.isActive !== false,
          durationPricing: Array.isArray(z.durationPricing) ? z.durationPricing : []
        }
      })
      setZones(safeZones)
      
      setIconUrl(service.iconUrl || '')
      setIsActive(service.isActive ?? true)
      setError('')
      setDurationPricing(Array.isArray(service.durationPricing) ? service.durationPricing : [])

      adminSettingsApi.getDurationOptions().then((res) => {
        if (Array.isArray(res.data?.durationOptions)) {
          setDurationOptions(res.data.durationOptions)
        }
      }).catch(() => {})
    }
  }, [open, service, subcategories])

  const availableSlots = useMemo(
    () => getMergedDurationSlots(durationOptions, durationPricing),
    [durationOptions, durationPricing]
  )

  if (!open || !service) return null

  async function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError('')
    setUploadBusy(true)
    try {
      const uploaded = await uploadMedia(file, UPLOAD_FOLDERS.LABOUR_CATEGORIES)
      const url = assetUrlFromUpload(uploaded)
      if (url) setIconUrl(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setUploadBusy(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !subcategoryId) {
      setError('Name and sub-category are required.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        subcategoryId,
        description: description.trim(),
        features,
        whatWeProvide,
        whatWeDontProvide,
        basePrice: Number(hourlyPrice), // Keep schema happy
        hourlyPrice: Number(hourlyPrice),
        minHours: parseFloat(minHours) || 0.5,
        maxHours: Number(maxHours),
        discountType,
        discountValue: Number(discountValue),
        isAllZones: zones.length === activeZones.length,
        zones: zones
          .filter(z => (typeof z.zone === 'object' ? z.zone?._id : z.zone))
          .map(z => ({
            zone: typeof z.zone === 'object' ? z.zone?._id : z.zone,
            price: Number(z.price) || 0,
            isActive: z.isActive !== false,
            durationPricing: Array.isArray(z.durationPricing)
              ? z.durationPricing.filter(d => (Number(d.price) > 0 || d.isActive))
              : []
          })),
        durationPricing: durationPricing.filter(dp => (dp.price > 0 || dp.isActive)),
        iconUrl: iconUrl.trim() || undefined,
        isActive
      }
      await updateAdminLabourService(service._id, payload)
      setBusy(false)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save service')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={() => !busy && !uploadBusy && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 px-5 py-4 flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-900">Edit Service</h3>
          <button onClick={() => !busy && !uploadBusy && onClose()} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5 max-h-[85vh] overflow-y-auto">
          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Sub-Category</label>
              <SearchableSelect
                value={subcategoryId}
                onChange={setSubcategoryId}
                options={subcategories.map(sc => ({ value: sc._id, label: `${sc.name} (${sc.categoryName})` }))}
                placeholder="Select a sub-category"
              />
            </div>
            
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
                placeholder="Optional description"
              />
            </div>

            {/* Bullet Points Section */}
            <div className="col-span-2 space-y-3 pt-1">
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Service Highlights & Details
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Add bullet points for features, what we provide, and what we don't provide.
                </p>
                <div className="space-y-3">
                  <BulletPointsEditor
                    label="Features"
                    icon={Sparkles}
                    iconColor="text-brand"
                    badgeStyle="border-indigo-100 bg-indigo-50/40 text-slate-800"
                    items={features}
                    onChange={setFeatures}
                    placeholder="e.g. Certified professionals, same-day service..."
                  />
                  <BulletPointsEditor
                    label="What We Provide"
                    icon={CheckCircle2}
                    iconColor="text-emerald-600"
                    badgeStyle="border-emerald-100 bg-emerald-50/40 text-slate-800"
                    items={whatWeProvide}
                    onChange={setWhatWeProvide}
                    placeholder="e.g. Standard tools, post-service cleanup..."
                  />
                  <BulletPointsEditor
                    label="What We Don't Provide"
                    icon={XCircle}
                    iconColor="text-rose-600"
                    badgeStyle="border-rose-100 bg-rose-50/40 text-slate-800"
                    items={whatWeDontProvide}
                    onChange={setWhatWeDontProvide}
                    placeholder="e.g. Spare parts/materials, civil alterations..."
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Price (₹)</label>
              <input
                type="number"
                min="0"
                value={hourlyPrice}
                onChange={(e) => setHourlyPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Min Hours <span className="normal-case font-normal text-slate-400">(0.5 = 30 min)</span></label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={minHours}
                onChange={(e) => setMinHours(parseFloat(e.target.value) || 0.5)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Max Hours</label>
              <input
                type="number"
                min="1"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35 bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                Discount {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
              />
            </div>

            <DurationPricingEditor
              globalOptions={durationOptions}
              durationPricing={durationPricing}
              setDurationPricing={setDurationPricing}
              baseHourlyPrice={hourlyPrice}
            />

            <ZonePricingEditor
              zones={zones}
              setZones={setZones}
              activeZones={activeZones}
              availableSlots={availableSlots}
              baseHourlyPrice={hourlyPrice}
            />

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/35"
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-[11px] font-bold uppercase text-slate-500">Icon</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-2 ring-slate-200">
                  {iconUrl ? (
                    <img src={getCategoryImageUrl({ name, imageUrl: iconUrl })} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-slate-400">None</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex gap-2">
                    <input type="file" accept="image/*" onChange={handleFilePick} className="hidden" id="edit-svc-img" />
                    <label
                      htmlFor="edit-svc-img"
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {uploadBusy ? 'Uploading...' : 'Upload'}
                    </label>
                    {iconUrl && (
                      <button
                        type="button"
                        onClick={() => setIconUrl('')}
                        className="text-[11px] font-bold text-rose-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="Or paste URL"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand/35"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => !busy && !uploadBusy && onClose()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <AppPrimaryButton type="submit" disabled={busy || uploadBusy} className="!w-auto px-6">
              {busy ? 'Saving...' : 'Save Changes'}
            </AppPrimaryButton>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ViewServiceModal({ open, service, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && service?._id) {
      setLoading(true)
      setError('')
      getAdminLabourServiceById(service._id)
        .then(res => setData(res.data.service))
        .catch(err => setError(err instanceof ApiError ? err.message : 'Failed to fetch details'))
        .finally(() => setLoading(false))
    } else {
      setData(null)
    }
  }, [open, service])

  if (!open || !service) return null
  
  const displayData = data || service
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-extrabold text-slate-900">Service Details</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading details...</div>
          ) : error ? (
            <div className="text-center py-10 text-rose-500">{error}</div>
          ) : (
            <>
              <div className="flex justify-center">
                 <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-slate-50 shadow-sm flex items-center justify-center">
                    {displayData.iconUrl ? (
                      <img src={getCategoryImageUrl({ name: displayData.name, imageUrl: displayData.iconUrl })} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Wrench className="h-8 w-8 text-slate-300" />
                    )}
                 </div>
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-xl font-bold text-slate-900">{displayData.name}</h4>
                <p className="text-sm font-semibold text-brand">{displayData.subcategoryName}</p>
                <p className="text-xs text-slate-500">{displayData.categoryName}</p>
              </div>
              
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Description</p>
                  <p className="text-sm font-medium text-slate-700">{displayData.description || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Price</p>
                    <p className="text-sm font-medium text-blue-600 font-mono">₹{displayData.hourlyPrice}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Status</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                      displayData.isActive ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                    }`}>
                      {displayData.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Sparkles className="h-4 w-4 text-brand" />
                    <span>Features</span>
                  </div>
                  <span className="rounded-full bg-indigo-100/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    {displayData.features?.length || 0}
                  </span>
                </div>
                {displayData.features?.length > 0 ? (
                  <ul className="space-y-1.5 pt-0.5">
                    {displayData.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] italic text-slate-400 pl-0.5">No features listed.</p>
                )}
              </div>

              {/* What We Provide Section */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>What We Provide</span>
                  </div>
                  <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {displayData.whatWeProvide?.length || 0}
                  </span>
                </div>
                {displayData.whatWeProvide?.length > 0 ? (
                  <ul className="space-y-1.5 pt-0.5">
                    {displayData.whatWeProvide.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] italic text-slate-400 pl-0.5">No inclusions listed.</p>
                )}
              </div>

              {/* What We Don't Provide Section */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>What We Don't Provide</span>
                  </div>
                  <span className="rounded-full bg-rose-100/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    {displayData.whatWeDontProvide?.length || 0}
                  </span>
                </div>
                {displayData.whatWeDontProvide?.length > 0 ? (
                  <ul className="space-y-1.5 pt-0.5">
                    {displayData.whatWeDontProvide.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] italic text-slate-400 pl-0.5">No exclusions listed.</p>
                )}
              </div>
            </>
          )}
        </div>
        <div className="bg-slate-50 px-5 py-3.5 text-right border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function DeleteServiceModal({ open, service, onClose, onDeleted, busy, setBusy }) {
  if (!open || !service) return null

  async function handleConfirm() {
    setBusy(true)
    try {
      await deleteAdminLabourService(service._id)
      setBusy(false)
      onDeleted()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Delete failed')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-rose-600" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Delete Service?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to delete <span className="font-bold text-slate-900">{service.name}</span>? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
          >
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function AdminServicesPage() {
  const reduce = useReducedMotion()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [subcategories, setSubcategories] = useState([])
  const [services, setServices] = useState([])
  
  // Filters & Search
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  
  // Modals state
  const [modalBusy, setModalBusy] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editService, setEditService] = useState(null)
  const [viewService, setViewService] = useState(null)
  const [deleteService, setDeleteService] = useState(null)
  const [activeZones, setActiveZones] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [treeRes, zonesRes] = await Promise.all([
        fetchAdminLabourCategoryTree(),
        adminZonesApi.getActiveZones().catch(() => ({ data: { zones: [] } }))
      ])
      
      const fetchedCategories = treeRes.data?.categories || []
      setActiveZones(zonesRes.data?.zones || [])
      
      const flatSubcategories = fetchedCategories.flatMap(c => 
        (c.subcategories || []).map(sc => ({
          ...sc,
          categoryId: c._id,
          categoryName: c.name
        }))
      )
      setSubcategories(flatSubcategories)

      const flatServices = flatSubcategories.flatMap(sc => 
        (sc.services || []).map(s => ({
          ...s,
          subcategoryId: sc._id,
          subcategoryName: sc.name,
          categoryName: sc.categoryName
        }))
      )
      setServices(flatServices)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, subcategoryFilter, zoneFilter, limit])

  const filteredServices = useMemo(() => {
    let result = services

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.subcategoryName.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      )
    }

    if (statusFilter === 'active') result = result.filter(s => s.isActive)
    else if (statusFilter === 'hidden') result = result.filter(s => !s.isActive)

    if (subcategoryFilter !== 'all') {
      result = result.filter(s => s.subcategoryId === subcategoryFilter)
    }

    if (zoneFilter !== 'all') {
      result = result.filter(s => {
        if (s.isAllZones) return true;
        return (s.zones || []).some(z => {
          const zid = typeof z === 'string' ? z : (typeof z.zone === 'object' ? z.zone?._id : z.zone);
          return String(zid) === zoneFilter;
        });
      });
    }

    return result
  }, [services, debouncedSearch, statusFilter, subcategoryFilter, zoneFilter])

  const totalPages = Math.ceil(filteredServices.length / limit) || 1
  const paginatedServices = filteredServices.slice((page - 1) * limit, page * limit)
  const activeCount = services.filter(s => s.isActive).length

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Services</h2>
          <p className="mt-1 text-sm text-slate-600">Manage individual services mapped to sub-categories.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <AppPrimaryButton onClick={() => setAddModalOpen(true)} className="!w-auto px-4 shadow-md">
            <Plus className="h-4 w-4" />
            Add Service
          </AppPrimaryButton>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Services</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{services.length}</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Active</p>
          <p className="mt-2 text-3xl font-black text-blue-600">{activeCount}</p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Sub-Categories</p>
          <p className="mt-2 text-3xl font-black text-brand">{subcategories.length}</p>
        </GlassPanel>
      </div>


      <GlassPanel className="relative z-20 p-4 md:p-5 space-y-3">
        {/* Search bar — full width */}
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services by name, sub-category or description..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[190px]">
            <SearchableSelect
              value={zoneFilter}
              onChange={setZoneFilter}
              options={[{ value: 'all', label: 'All Zones (Global)' }, ...activeZones.map(z => ({ value: z._id, label: z.name }))]}
            />
          </div>
          <div className="w-[210px]">
            <SearchableSelect
              value={subcategoryFilter}
              onChange={setSubcategoryFilter}
              options={[{ value: 'all', label: 'All Sub-Categories' }, ...subcategories.map(sc => ({ value: sc._id, label: sc.name }))]}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-brand/35"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-brand/35"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>

          {/* Active filter indicators */}
          {(search || subcategoryFilter !== 'all' || zoneFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSubcategoryFilter('all'); setZoneFilter('all'); setStatusFilter('all') }}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </GlassPanel>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
      ) : null}

      <GlassPanel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Sub-Category</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No services found.</td>
                </tr>
              ) : (
                paginatedServices.map(s => (
                  <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center">
                        {s.iconUrl ? (
                          <img src={getCategoryImageUrl({ name: s.name, imageUrl: s.iconUrl })} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Wrench className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {s.subcategoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-semibold text-slate-700">{s.categoryName}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">
                      {(() => {
                        let displayPrice = s.hourlyPrice;
                        let isZonePrice = false;
                        if (zoneFilter !== 'all') {
                          const matchedZone = (s.zones || []).find(z => {
                            const zid = typeof z === 'string' ? z : (typeof z.zone === 'object' ? z.zone?._id : z.zone);
                            return String(zid) === zoneFilter;
                          });
                          if (matchedZone) {
                            if (typeof matchedZone === 'string') {
                              // If it's a legacy string zone, it doesn't have a specific price override
                              // But it IS in the zone, so we could show GLOBAL badge, or ZONE badge.
                              // Let's stick with GLOBAL since there's no price override.
                            } else if (typeof matchedZone.price === 'number') {
                              displayPrice = matchedZone.price;
                              isZonePrice = true;
                            }
                          }
                        }
                        return (
                          <div className="flex flex-col items-end gap-0.5">
                            <span>₹{displayPrice}</span>
                            {zoneFilter !== 'all' ? (
                              isZonePrice ? (
                                <span className="rounded bg-brand/10 px-1 py-0.5 text-[9px] font-bold text-brand uppercase tracking-wider">Zone</span>
                              ) : (
                                <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Global</span>
                              )
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                        s.isActive ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}>
                        {s.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setViewService(s)}
                          title="View Details"
                          className="rounded-lg border border-transparent p-1.5 text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-sky-600 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditService(s)}
                          title="Edit Service"
                          className="rounded-lg border border-transparent p-1.5 text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-brand transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteService(s)}
                          title="Delete Service"
                          className="rounded-lg border border-transparent p-1.5 text-slate-400 hover:border-slate-200 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
             <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
               <p className="text-xs font-semibold text-slate-500">
                 Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredServices.length)} of {filteredServices.length}
               </p>
               <div className="flex items-center gap-2">
                 <button
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                 >
                   Prev
                 </button>
                 <span className="text-xs font-bold text-slate-700">
                   {page} / {totalPages}
                 </span>
                 <button
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                 >
                   Next
                 </button>
               </div>
             </div>
          )}
        </div>
      </GlassPanel>

        <AddServiceModal
          open={addModalOpen}
          subcategories={subcategories}
          activeZones={activeZones}
          onClose={() => setAddModalOpen(false)}
          onSaved={() => {
            setAddModalOpen(false)
            load()
          }}
          busy={modalBusy}
          setBusy={setModalBusy}
        />
        <EditServiceModal
          open={!!editService}
          service={editService}
          subcategories={subcategories}
          activeZones={activeZones}
          onClose={() => setEditService(null)}
          onSaved={() => {
            setEditService(null)
            load()
          }}
          busy={modalBusy}
          setBusy={setModalBusy}
        />

      <ViewServiceModal
        open={!!viewService}
        service={viewService}
        onClose={() => setViewService(null)}
      />

      <DeleteServiceModal
        open={!!deleteService}
        service={deleteService}
        onClose={() => setDeleteService(null)}
        onDeleted={() => {
          setDeleteService(null)
          setModalBusy(false)
          load()
        }}
        busy={modalBusy}
        setBusy={setModalBusy}
      />
    </div>
  )
}
