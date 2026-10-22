import { useCallback, useEffect, useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Search, RefreshCw, Edit2, Trash2, Wrench, Eye, X, AlertTriangle, ChevronDown, ChevronUp, Clock, Sparkles, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react'
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
  if (Array.isArray(durationPricing) && durationPricing.length > 0) {
    durationPricing.forEach(dp => {
      if (dp && dp.minutes > 0) {
        map.set(dp.minutes, { ...dp, isGlobal: false })
      }
    })
  } else {
    globalOptions.forEach(opt => {
      map.set(opt.minutes, { minutes: opt.minutes, label: opt.label, tag: opt.tag, isGlobal: true })
    })
  }
  return Array.from(map.values()).sort((a, b) => a.minutes - b.minutes)
}

function DurationPricingEditor({
  globalOptions = [],
  durationPricing = [],
  setDurationPricing,
  baseHourlyPrice = 0,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingMinute, setEditingMinute] = useState(null)
  const [formHours, setFormHours] = useState('0')
  const [formMins, setFormMins] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDiscountType, setFormDiscountType] = useState('PERCENTAGE')
  const [formDiscountValue, setFormDiscountValue] = useState('0')
  const [formIsActive, setFormIsActive] = useState(true)
  const [slotError, setSlotError] = useState('')

  // Only display the slots configured for this specific service
  const serviceSlots = useMemo(() => {
    return (Array.isArray(durationPricing) ? durationPricing : [])
      .filter(dp => dp && Number(dp.minutes) > 0)
      .sort((a, b) => a.minutes - b.minutes)
  }, [durationPricing])

  const handlePriceChange = (minutes, newPrice) => {
    setDurationPricing(prev => {
      const idx = prev.findIndex(p => p.minutes === minutes)
      const val = newPrice === '' ? '' : Math.max(0, parseFloat(newPrice) || 0)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], price: val }
        return updated
      }
      return prev
    })
  }

  const handleDiscountChange = (minutes, field, value) => {
    setDurationPricing(prev => {
      const idx = prev.findIndex(p => p.minutes === minutes)
      const val = field === 'discountValue' ? Math.max(0, parseFloat(value) || 0) : value
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], [field]: val }
        return updated
      }
      return prev
    })
  }

  const handleActiveToggle = (minutes, newActive) => {
    setDurationPricing(prev => {
      const idx = prev.findIndex(p => p.minutes === minutes)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], isActive: newActive }
        return updated
      }
      return prev
    })
  }

  const handleRemoveSlot = (minutes) => {
    setDurationPricing(prev => prev.filter(p => p.minutes !== minutes))
    if (editingMinute === minutes) {
      handleCancelForm()
    }
  }

  const handleStartAdd = () => {
    setEditingMinute(null)
    setFormHours('0')
    setFormMins('30')
    setFormLabel('')
    setFormPrice(baseHourlyPrice ? String(Math.round(Number(baseHourlyPrice) * 0.5)) : '')
    setFormDiscountType('PERCENTAGE')
    setFormDiscountValue('0')
    setFormIsActive(true)
    setSlotError('')
    setShowForm(true)
  }

  const handleStartEdit = (slot) => {
    setEditingMinute(slot.minutes)
    setFormHours(String(Math.floor(slot.minutes / 60)))
    setFormMins(String(slot.minutes % 60))
    setFormLabel(slot.label || '')
    setFormPrice(slot.price != null ? String(slot.price) : '')
    setFormDiscountType(slot.discountType || 'PERCENTAGE')
    setFormDiscountValue(slot.discountValue != null ? String(slot.discountValue) : '0')
    setFormIsActive(slot.isActive !== false)
    setSlotError('')
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingMinute(null)
    setFormHours('')
    setFormMins('')
    setFormLabel('')
    setFormPrice('')
    setFormDiscountType('PERCENTAGE')
    setFormDiscountValue('0')
    setFormIsActive(true)
    setSlotError('')
  }

  const handleSaveSlot = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault()
      if (typeof e.stopPropagation === 'function') e.stopPropagation()
    }
    setSlotError('')

    const hrs = parseInt(formHours, 10) || 0
    const mins = parseInt(formMins, 10) || 0
    const totalMinutes = hrs * 60 + mins

    if (totalMinutes <= 0) {
      setSlotError('Duration must be greater than 0 minutes.')
      return
    }

    let label = formLabel.trim()
    if (!label) {
      if (hrs > 0 && mins > 0) label = `${hrs} hr ${mins} min`
      else if (hrs > 0) label = hrs === 1 ? '1 Hour' : `${hrs} Hours`
      else label = `${mins} Minutes`
    }

    let price = 0
    if (formPrice !== '' && !isNaN(Number(formPrice))) {
      price = Math.max(0, parseFloat(formPrice))
    } else if (baseHourlyPrice) {
      price = Math.round(Number(baseHourlyPrice) * (totalMinutes / 60))
    }

    let tag = null
    if (totalMinutes === 360) tag = 'half_day'
    else if (totalMinutes === 720) tag = 'full_day'

    setDurationPricing(prev => {
      const arr = Array.isArray(prev) ? [...prev] : []
      let next = arr
      if (editingMinute != null) {
        next = next.filter(p => p.minutes !== editingMinute)
      }
      next = next.filter(p => p.minutes !== totalMinutes)
      next.push({
        minutes: totalMinutes,
        label,
        tag,
        price,
        discountType: formDiscountType,
        discountValue: Math.max(0, parseFloat(formDiscountValue) || 0),
        isActive: formIsActive,
      })
      return next.sort((a, b) => a.minutes - b.minutes)
    })

    handleCancelForm()
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSaveSlot(e)
    }
  }

  const handleAutoFill = () => {
    const hourly = parseFloat(baseHourlyPrice) || 0
    if (!hourly) return

    if (serviceSlots.length === 0 && globalOptions.length > 0) {
      // If service has no slots set yet, seed standard presets
      const presets = [10, 30, 60, 120, 360, 720]
      const chosen = globalOptions.filter(g => presets.includes(g.minutes))
      const populated = (chosen.length > 0 ? chosen : globalOptions.slice(0, 6)).map(opt => ({
        minutes: opt.minutes,
        label: opt.label,
        tag: opt.tag || null,
        price: Math.round(hourly * (opt.minutes / 60)),
        isActive: true,
      }))
      setDurationPricing(populated)
      return
    }

    // Recalculate price for current configured slots
    const filled = serviceSlots.map(slot => ({
      ...slot,
      price: Math.round(hourly * (slot.minutes / 60)),
    }))
    setDurationPricing(filled)
  }

  const handleLoadStandardPresets = () => {
    const hourly = parseFloat(baseHourlyPrice) || 500
    const presets = [10, 30, 60, 120, 360, 720]
    const chosen = globalOptions.filter(g => presets.includes(g.minutes))
    const populated = (chosen.length > 0 ? chosen : [
      { minutes: 10, label: '10 Minutes', tag: null },
      { minutes: 30, label: '30 Minutes', tag: null },
      { minutes: 60, label: '1 Hour', tag: null },
      { minutes: 120, label: '2 Hours', tag: null },
      { minutes: 360, label: 'Half Day (6 hrs)', tag: 'half_day' },
      { minutes: 720, label: 'Full Day (12 hrs)', tag: 'full_day' },
    ]).map(opt => ({
      minutes: opt.minutes,
      label: opt.label,
      tag: opt.tag || null,
      price: Math.round(hourly * (opt.minutes / 60)),
      isActive: true,
    }))
    setDurationPricing(populated)
  }

  return (
    <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-700">
            Duration-Based Pricing (Dynamic Service Time)
          </label>
          <p className="text-[11px] text-slate-500">
            Configure custom duration timings for this service. Customers will only see the slots enabled for this service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showForm ? handleCancelForm : handleStartAdd}
            className="flex items-center gap-1 rounded-lg border border-brand bg-brand px-2.5 py-1 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? 'Cancel' : 'Add Time Slot'}
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

      {showForm && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {editingMinute != null ? 'Edit Dynamic Time Slot' : 'Add New Dynamic Time Slot'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Time set here applies specifically to this service
            </span>
          </div>

          {slotError && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700">
              {slotError}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                placeholder="0"
                value={formHours}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => setFormHours(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                placeholder="15"
                value={formMins}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => setFormMins(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 10 min, Half Day"
                value={formLabel}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => setFormLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Price (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formPrice}
                onKeyDown={handleInputKeyDown}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Slot Discount Type</label>
              <select
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand shadow-2xs"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Discount Value</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  {formDiscountType === 'FIXED' ? '₹' : '%'}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formDiscountValue}
                  onKeyDown={handleInputKeyDown}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/35 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">
                Slot Enabled (Visible to customers)
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                className="rounded-lg bg-brand px-3.5 py-1 text-xs font-bold text-white hover:bg-brand/90 transition shadow-sm"
              >
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {serviceSlots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center space-y-2">
          <p className="text-xs font-medium text-slate-500">
            No duration slots configured for this service yet.
          </p>
          <p className="text-[11px] text-slate-400">
            You can add custom timings (e.g. 10 min, Half Day, Full Day) or load standard presets.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleStartAdd}
              className="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white hover:bg-brand/90 shadow-2xs"
            >
              + Add First Time Slot
            </button>
            <button
              type="button"
              onClick={handleLoadStandardPresets}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Load Standard Presets
            </button>
          </div>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 bg-slate-100">Duration</th>
                <th className="px-3 py-2 w-32 bg-slate-100">Price (₹)</th>
                <th className="px-3 py-2 w-36 bg-slate-100">Slot Discount</th>
                <th className="px-3 py-2 w-24 text-right bg-slate-100">Final (₹)</th>
                <th className="px-3 py-2 w-24 text-center bg-slate-100">Enabled</th>
                <th className="px-2 py-2 w-20 text-center bg-slate-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {serviceSlots.map(opt => {
                const price = opt.price ?? ''
                const discountType = opt.discountType || 'PERCENTAGE'
                const discountValue = opt.discountValue || 0
                const numPrice = Number(price) || 0
                const discAmt = discountType === 'FIXED' ? Number(discountValue) : Math.round((numPrice * Number(discountValue)) / 100)
                const finalPrice = Math.max(0, numPrice - discAmt)
                const isActive = opt.isActive !== false
                const isSpecial = opt.tag === 'half_day' || opt.tag === 'full_day'

                return (
                  <tr key={opt.minutes} className={`hover:bg-slate-50/70 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/50' : isSpecial ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800">{opt.label}</span>
                        {isSpecial && (
                          <span className="text-[9px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                            {opt.tag === 'half_day' ? 'Half Day' : 'Full Day'}
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-slate-400">
                          ({opt.minutes}m)
                        </span>
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
                          className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-brand bg-white"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        <select
                          value={discountType}
                          onChange={(e) => handleDiscountChange(opt.minutes, 'discountType', e.target.value)}
                          className="w-14 rounded-md border border-slate-200 bg-white px-1 py-1 text-[11px] font-bold outline-none focus:border-brand"
                        >
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED">₹</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={discountValue || ''}
                          placeholder="0"
                          onChange={(e) => handleDiscountChange(opt.minutes, 'discountValue', e.target.value)}
                          className="w-full rounded-md border border-slate-200 px-1.5 py-1 text-[11px] font-bold text-slate-900 outline-none focus:border-brand"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {numPrice > 0 ? (
                        <div className="flex flex-col items-end leading-tight">
                          <span className={discAmt > 0 ? "text-emerald-700 font-extrabold text-xs" : "text-slate-700 font-bold text-xs"}>
                            ₹{finalPrice}
                          </span>
                          {discAmt > 0 && (
                            <span className="text-[9px] text-slate-400 line-through">
                              ₹{numPrice}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleActiveToggle(opt.minutes, !isActive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={isActive ? 'Click to Disable' : 'Click to Enable'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {isActive ? 'Active' : 'Off'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(opt)}
                          className="p-1 text-slate-500 hover:text-brand rounded hover:bg-brand/10 transition"
                          title="Edit this slot"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(opt.minutes)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Remove this slot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
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
    setZones(prev => [
      ...prev,
      {
        zone: '',
        price: 0,
        discountType: 'PERCENTAGE',
        discountValue: 0,
        isActive: true,
        durationPricing: [],
      },
    ])
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
      const numPrice = price === '' ? '' : Math.max(0, parseFloat(price) || 0)
      if (idx >= 0) {
        slots[idx] = { ...slots[idx], price: numPrice }
      } else {
        slots.push({
          minutes,
          label: opt.label || `${minutes} min`,
          tag: opt.tag || null,
          price: numPrice,
          discountType: opt.discountType || 'PERCENTAGE',
          discountValue: opt.discountValue || 0,
          isActive: true,
        })
      }
      currentZone.durationPricing = slots
      next[zoneIdx] = currentZone
      return next
    })
  }

  const handleZoneSlotDiscountChange = (zoneIdx, minutes, field, value, opt) => {
    setZones(prev => {
      const next = [...prev]
      const currentZone = { ...next[zoneIdx] }
      const slots = Array.isArray(currentZone.durationPricing) ? [...currentZone.durationPricing] : []
      const idx = slots.findIndex(s => s.minutes === minutes)
      const val = field === 'discountValue' ? Math.max(0, parseFloat(value) || 0) : value
      if (idx >= 0) {
        slots[idx] = { ...slots[idx], [field]: val }
      } else {
        slots.push({
          minutes,
          label: opt.label || `${minutes} min`,
          tag: opt.tag || null,
          price: opt.price || 0,
          discountType: field === 'discountType' ? val : (opt.discountType || 'PERCENTAGE'),
          discountValue: field === 'discountValue' ? val : (opt.discountValue || 0),
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
          price: opt.price || 0,
          discountType: opt.discountType || 'PERCENTAGE',
          discountValue: opt.discountValue || 0,
          isActive,
        })
      }
      currentZone.durationPricing = slots
      next[zoneIdx] = currentZone
      return next
    })
  }

  const handleAutoFillZone = (zoneIdx, mode = 'base') => {
    const currentZone = zones[zoneIdx]
    const hourly = parseFloat(currentZone.price) || parseFloat(baseHourlyPrice) || 0
    const baseHourly = parseFloat(baseHourlyPrice) || 0
    if (!hourly && availableSlots.length === 0) return

    const filled = availableSlots.map(opt => {
      let priceToSet
      if (mode === 'hourly') {
        priceToSet = Math.round(hourly * (opt.minutes / 60))
      } else {
        const baseSlot = Number(opt.price) || 0
        if (baseSlot > 0) {
          if (hourly > 0 && baseHourly > 0 && hourly !== baseHourly) {
            priceToSet = Math.round(baseSlot * (hourly / baseHourly))
          } else {
            priceToSet = baseSlot
          }
        } else {
          priceToSet = Math.round(hourly * (opt.minutes / 60))
        }
      }

      return {
        minutes: opt.minutes,
        label: opt.label,
        tag: opt.tag,
        price: priceToSet,
        discountType: opt.discountType || currentZone.discountType || 'PERCENTAGE',
        discountValue: opt.discountValue != null ? opt.discountValue : (currentZone.discountValue || 0),
        isActive: true,
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-700">
            Zone Availability & Zone-Wise Pricing & Discounts
          </label>
          <p className="text-[11px] text-slate-500">
            Set zone-specific hourly rates, zone discounts, and duration slot prices. Discounts are applied zone-wise.
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
          No zone-specific pricing or discount added. Base service rate applies to all zones.
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zoneItem, idx) => {
            const isExpanded = expandedZoneIdx === idx
            const zoneId = typeof zoneItem.zone === 'object' ? zoneItem.zone._id : (zoneItem.zone || '')
            const configuredSlotCount = availableSlots.filter(opt => {
              const current = (zoneItem.durationPricing || []).find(p => p.minutes === opt.minutes)
              return current && current.price > 0 && current.isActive !== false
            }).length

            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-3">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <div className="flex-1 min-w-[130px]">
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

                  <div className="w-28 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹/hr</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Hourly"
                        value={zoneItem.price ?? ''}
                        onChange={(e) => handleZoneChange(idx, 'price', Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-2 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand/35"
                      />
                    </div>
                  </div>

                  <div className="w-28 shrink-0">
                    <select
                      value={zoneItem.discountType || 'PERCENTAGE'}
                      onChange={(e) => handleZoneChange(idx, 'discountType', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand/35 bg-white"
                      title="Discount Type for this Zone"
                    >
                      <option value="PERCENTAGE">Disc (%)</option>
                      <option value="FIXED">Disc (₹)</option>
                    </select>
                  </div>

                  <div className="w-24 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        {zoneItem.discountType === 'FIXED' ? '₹' : '%'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={zoneItem.discountValue ?? ''}
                        onChange={(e) => handleZoneChange(idx, 'discountValue', Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 pl-6 pr-2 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand/35"
                        title="Discount Value for this Zone"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedZoneIdx(isExpanded ? null : idx)}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition border shrink-0 ${
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
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition shrink-0"
                    title="Remove Zone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-700">
                          Zone Time Slots ({availableSlots.length} Active Slots)
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Set exact custom price for this zone for each active time slot of this service.
                        </p>
                      </div>
                      {availableSlots.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAutoFillZone(idx, 'base')}
                            className="rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-[11px] font-bold text-brand hover:bg-brand/10 transition"
                            title="Copy prices and discounts from base service time slots"
                          >
                            Copy Base Slots
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAutoFillZone(idx, 'hourly')}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
                            title="Calculate slot prices as Zone Hourly Rate × duration"
                          >
                            Auto-fill from ₹/hr
                          </button>
                        </div>
                      )}
                    </div>

                    {availableSlots.length === 0 ? (
                      <p className="text-xs italic text-slate-400 p-2">
                        No active duration slots configured for this service yet. Add or enable time slots in the Duration section above first.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-1.5">Duration</th>
                              <th className="px-3 py-1.5 w-28">Zone Price (₹)</th>
                              <th className="px-3 py-1.5 w-36">Time Discount</th>
                              <th className="px-3 py-1.5 w-24 text-right">Final (₹)</th>
                              <th className="px-3 py-1.5 w-16 text-center">Active</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {availableSlots.map(opt => {
                              const current = (zoneItem.durationPricing || []).find(p => p.minutes === opt.minutes)
                              const price = current?.price !== undefined && current?.price !== '' ? current.price : ''
                              const discountType = current?.discountType || opt.discountType || zoneItem.discountType || 'PERCENTAGE'
                              const discountValue = current?.discountValue != null ? current.discountValue : (opt.discountValue != null ? opt.discountValue : (zoneItem.discountValue || 0))
                              const isActive = current?.isActive ?? true
                              const isSpecial = opt.tag === 'half_day' || opt.tag === 'full_day'
                              const baseSlotPrice = Number(opt.price) || 0
                              const hourlyFallback = zoneItem.price ? Math.round(zoneItem.price * (opt.minutes / 60)) : 0
                              const defaultSlotPrice = baseSlotPrice > 0 ? baseSlotPrice : hourlyFallback
                              const numPrice = Number(price) > 0 ? Number(price) : defaultSlotPrice
                              const discAmt = discountType === 'FIXED' ? Number(discountValue) : Math.round((numPrice * Number(discountValue)) / 100)
                              const finalPrice = Math.max(0, numPrice - discAmt)

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
                                        placeholder={defaultSlotPrice ? String(defaultSlotPrice) : '0'}
                                        onChange={(e) => handleZoneSlotPriceChange(idx, opt.minutes, e.target.value, opt)}
                                        className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-brand"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-3 py-1">
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={discountType}
                                        onChange={(e) => handleZoneSlotDiscountChange(idx, opt.minutes, 'discountType', e.target.value, opt)}
                                        className="w-14 rounded-md border border-slate-200 bg-white px-1 py-1 text-[11px] font-bold outline-none focus:border-brand"
                                        title="Discount Type for this time slot"
                                      >
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">₹</option>
                                      </select>
                                      <div className="relative flex-1 min-w-[45px]">
                                        <input
                                          type="number"
                                          min="0"
                                          value={discountValue || ''}
                                          placeholder="0"
                                          onChange={(e) => handleZoneSlotDiscountChange(idx, opt.minutes, 'discountValue', e.target.value, opt)}
                                          className="w-full rounded-md border border-slate-200 px-1.5 py-1 text-[11px] font-bold text-slate-900 outline-none focus:border-brand"
                                          title="Discount Value for this time slot"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-1 text-right font-mono">
                                    {numPrice > 0 ? (
                                      <div className="flex flex-col items-end leading-tight">
                                        <span className={discAmt > 0 ? "text-emerald-700 font-extrabold text-xs" : "text-slate-700 font-bold text-xs"}>
                                          ₹{finalPrice}
                                        </span>
                                        {discAmt > 0 && (
                                          <span className="text-[9px] text-slate-400 line-through">
                                            ₹{numPrice}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
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
                    )}
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

function MultipleImagesEditor({
  images = [],
  setImages,
  uploadBusy,
  setUploadBusy,
  setError,
}) {
  const [urlInput, setUrlInput] = useState('')

  const handleMultipleFilesPick = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError('')
    setUploadBusy(true)
    try {
      const uploadedUrls = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const uploaded = await uploadMedia(file, UPLOAD_FOLDERS.LABOUR_CATEGORIES)
        const url = assetUrlFromUpload(uploaded)
        if (url) uploadedUrls.push(url)
      }
      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setUploadBusy(false)
      e.target.value = ''
    }
  }

  const handleAddUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    setImages(prev => [...prev, trimmed])
    setUrlInput('')
  }

  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="col-span-2 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
            <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
            <span>Showcase Gallery (Multiple Images)</span>
            <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
              {images.length}
            </span>
          </label>
          <p className="text-[11px] text-slate-500">
            Upload multiple photos (samples, work results, tools). These display to customers right above the "Book Now" button.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-50 transition active:scale-98">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultipleFilesPick}
            className="hidden"
            disabled={uploadBusy}
          />
          <Plus className="h-3.5 w-3.5" />
          <span>{uploadBusy ? 'Uploading Photos...' : 'Upload Photos (Multiple)'}</span>
        </label>

        <div className="flex flex-1 min-w-[200px] items-center gap-1">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
            placeholder="Or paste image URL"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-brand/35"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition"
          >
            Add
          </button>
        </div>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2">
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="group relative aspect-4/3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
            >
              <img
                src={imgUrl}
                alt={`Photo ${idx + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition active:scale-90 cursor-pointer"
                title="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400 bg-white/50">
          No showcase photos added yet. Click "Upload Photos (Multiple)" to select multiple images from your computer.
        </div>
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
  const [images, setImages] = useState([])
  const [isActive, setIsActive] = useState(true)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [error, setError] = useState('')
  const [durationOptions, setDurationOptions] = useState([])
  const [durationPricing, setDurationPricing] = useState([])

  const defaultSubcatId = subcategories[0]?._id ?? ''
  useEffect(() => {
    if (open) {
      setName('')
      setSubcategoryId(defaultSubcatId)
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
      setImages([])
      setIsActive(true)
      setError('')
      setDurationPricing([])
      adminSettingsApi.getDurationOptions().then((res) => {
        if (Array.isArray(res.data?.durationOptions)) {
          setDurationOptions(res.data.durationOptions)
        }
      }).catch(() => {})
    }
  }, [open, defaultSubcatId])

  const serviceSlotsForZones = useMemo(
    () => (Array.isArray(durationPricing) ? durationPricing : []).filter(dp => Number(dp.minutes) > 0 && dp.isActive === true),
    [durationPricing]
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
      const activeDurationMinutes = new Set(
        durationPricing.filter(dp => Number(dp.minutes) > 0 && dp.isActive === true).map(dp => Number(dp.minutes))
      )
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
        discountType: 'PERCENTAGE',
        discountValue: 0,
        isAllZones: zones.length === activeZones.length,
        zones: zones
          .filter(z => (typeof z.zone === 'object' ? z.zone?._id : z.zone))
          .map(z => ({
            zone: typeof z.zone === 'object' ? z.zone?._id : z.zone,
            price: Number(z.price) || 0,
            discountType: z.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
            discountValue: Number(z.discountValue) || 0,
            isActive: z.isActive !== false,
            durationPricing: Array.isArray(z.durationPricing)
              ? z.durationPricing
                  .filter(d => activeDurationMinutes.has(Number(d.minutes)) && (Number(d.price) > 0 || d.isActive))
                  .map(d => ({
                    minutes: Number(d.minutes),
                    label: d.label || `${d.minutes} min`,
                    tag: d.tag || null,
                    price: Number(d.price) || 0,
                    discountType: d.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
                    discountValue: Math.max(0, Number(d.discountValue) || 0),
                    isActive: d.isActive !== false,
                  }))
              : []
          })),
        durationPricing: durationPricing
          .filter(dp => Number(dp.minutes) > 0)
          .map(dp => ({
            minutes: Number(dp.minutes),
            label: dp.label || `${dp.minutes} min`,
            tag: dp.tag || null,
            price: Number(dp.price) || 0,
            discountType: dp.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
            discountValue: Math.max(0, Number(dp.discountValue) || 0),
            isActive: dp.isActive !== false,
          })),
        images: Array.isArray(images) ? images.map(img => String(img).trim()).filter(Boolean) : [],
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
              availableSlots={serviceSlotsForZones}
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

            <MultipleImagesEditor
              images={images}
              setImages={setImages}
              uploadBusy={uploadBusy}
              setUploadBusy={setUploadBusy}
              setError={setError}
            />
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
  const [images, setImages] = useState([])
  const [isActive, setIsActive] = useState(true)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [error, setError] = useState('')
  const [durationOptions, setDurationOptions] = useState([])
  const [durationPricing, setDurationPricing] = useState([])

  const serviceId = service?._id
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
        if (typeof z === 'string') return { zone: z, price: service.hourlyPrice ?? 0, discountType: 'PERCENTAGE', discountValue: 0, isActive: true, durationPricing: [] }
        return {
          zone: typeof z.zone === 'object' ? z.zone?._id : (z.zone || ''),
          price: z.price ?? service.hourlyPrice ?? 0,
          discountType: z.discountType || 'PERCENTAGE',
          discountValue: z.discountValue ?? 0,
          isActive: z.isActive !== false,
          durationPricing: Array.isArray(z.durationPricing) ? z.durationPricing : []
        }
      })
      setZones(safeZones)
      
      setIconUrl(service.iconUrl || '')
      setImages(Array.isArray(service.images) ? service.images : [])
      setIsActive(service.isActive ?? true)
      setError('')
      setDurationPricing(Array.isArray(service.durationPricing) ? service.durationPricing : [])

      adminSettingsApi.getDurationOptions().then((res) => {
        if (Array.isArray(res.data?.durationOptions)) {
          setDurationOptions(res.data.durationOptions)
        }
      }).catch(() => {})
    }
  }, [open, serviceId])

  const serviceSlotsForZones = useMemo(
    () => (Array.isArray(durationPricing) ? durationPricing : []).filter(dp => Number(dp.minutes) > 0 && dp.isActive === true),
    [durationPricing]
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
      const activeDurationMinutes = new Set(
        durationPricing.filter(dp => Number(dp.minutes) > 0 && dp.isActive === true).map(dp => Number(dp.minutes))
      )
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
        discountType: 'PERCENTAGE',
        discountValue: 0,
        isAllZones: zones.length === activeZones.length,
        zones: zones
          .filter(z => (typeof z.zone === 'object' ? z.zone?._id : z.zone))
          .map(z => ({
            zone: typeof z.zone === 'object' ? z.zone?._id : z.zone,
            price: Number(z.price) || 0,
            discountType: z.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
            discountValue: Number(z.discountValue) || 0,
            isActive: z.isActive !== false,
            durationPricing: Array.isArray(z.durationPricing)
              ? z.durationPricing
                  .filter(d => activeDurationMinutes.has(Number(d.minutes)) && (Number(d.price) > 0 || d.isActive))
                  .map(d => ({
                    minutes: Number(d.minutes),
                    label: d.label || `${d.minutes} min`,
                    tag: d.tag || null,
                    price: Number(d.price) || 0,
                    discountType: d.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
                    discountValue: Math.max(0, Number(d.discountValue) || 0),
                    isActive: d.isActive !== false,
                  }))
              : []
          })),
        durationPricing: durationPricing
          .filter(dp => Number(dp.minutes) > 0)
          .map(dp => ({
            minutes: Number(dp.minutes),
            label: dp.label || `${dp.minutes} min`,
            tag: dp.tag || null,
            price: Number(dp.price) || 0,
            discountType: dp.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
            discountValue: Math.max(0, Number(dp.discountValue) || 0),
            isActive: dp.isActive !== false,
          })),
        images: Array.isArray(images) ? images.map(img => String(img).trim()).filter(Boolean) : [],
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
              availableSlots={serviceSlotsForZones}
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

            <MultipleImagesEditor
              images={images}
              setImages={setImages}
              uploadBusy={uploadBusy}
              setUploadBusy={setUploadBusy}
              setError={setError}
            />
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        {Array.isArray(s.images) && s.images.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60" title={`${s.images.length} showcase photos`}>
                            <ImageIcon className="h-3 w-3" />
                            {s.images.length}
                          </span>
                        )}
                      </div>
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
