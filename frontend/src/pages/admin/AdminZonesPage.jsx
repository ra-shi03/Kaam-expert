import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Map, AlertTriangle, CheckCircle2, Loader2, Target, Users, BookOpen } from 'lucide-react'
import { adminZonesApi } from '../../api/adminZonesApi.js'
import { ApiError } from '../../api/http.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'

const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-500'

function SettingsSection({ icon: Icon, title, description, children, accent = 'brand' }) {
  return (
    <GlassPanel className="overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${accent}/10 text-${accent}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </GlassPanel>
  )
}

function StatCard({ icon: Icon, label, value, description, accent = 'brand' }) {
  return (
    <GlassPanel className="p-5 flex items-start gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-${accent}/10 text-${accent}`}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
    </GlassPanel>
  )
}

function Toast({ message, variant = 'success' }) {
  if (!message) return null
  const styles = variant === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-900'
    : 'border-blue-200 bg-blue-50 text-blue-900'
  const Icon = variant === 'error' ? AlertTriangle : CheckCircle2
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed left-4 right-4 top-20 z-50 mx-auto flex max-w-lg items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${styles}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </motion.div>
  )
}

export function AdminZonesPage() {
  const reduce = useReducedMotion()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ message: '', variant: 'success' })

  const [bookingBroadcastRadius, setBookingBroadcastRadius] = useState('')
  const [b2bBroadcastRadius, setB2bBroadcastRadius] = useState('')
  const [stats, setStats] = useState(null)

  const showToast = useCallback((message, variant = 'success') => {
    setToast({ message, variant })
    setTimeout(() => setToast({ message: '', variant: 'success' }), 3500)
  }, [])

  useEffect(() => {
    let cancelled = false
    
    Promise.all([
      adminZonesApi.getZoneSettings(),
      adminZonesApi.getZoneStatistics().catch(() => ({ data: {} })) // Prevent UI block if stats fail
    ])
    .then(([settingsRes, statsRes]) => {
      if (cancelled) return
      
      if (settingsRes.data?.bookingBroadcastRadius != null) {
        setBookingBroadcastRadius(String(settingsRes.data.bookingBroadcastRadius))
      }
      if (settingsRes.data?.b2bBroadcastRadius != null) {
        setB2bBroadcastRadius(String(settingsRes.data.b2bBroadcastRadius))
      }
      
      if (statsRes.data?.data) {
        setStats(statsRes.data.data)
      }
    })
    .catch((err) => {
      if (!cancelled) showToast(err instanceof ApiError ? err.message : 'Failed to load zone data', 'error')
    })
    .finally(() => {
      if (!cancelled) setLoading(false)
    })
    
    return () => { cancelled = true }
  }, [showToast])

  const handleSave = async () => {
    if (!bookingBroadcastRadius || Number(bookingBroadcastRadius) <= 0) {
      showToast('Booking Radius must be greater than 0', 'error')
      return
    }
    if (!b2bBroadcastRadius || Number(b2bBroadcastRadius) <= 0) {
      showToast('Contractor/Vendor Radius must be greater than 0', 'error')
      return
    }
    
    setSaving(true)
    try {
      await adminZonesApi.updateZoneSettings({
        bookingBroadcastRadius: Number(bookingBroadcastRadius),
        b2bBroadcastRadius: Number(b2bBroadcastRadius)
      })
      showToast('Broadcast radius updated successfully')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update radius', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Toast message={toast.message} variant={toast.variant} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-brand text-white shadow-lg ring-4 ring-brand/10">
            <Map className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manage Radius & Zones</h1>
            <p className="text-sm text-slate-500">Configure the flash broadcast radius and view matching statistics</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Settings */}
        <div className="lg:col-span-5 space-y-6">
          <SettingsSection
            icon={Target}
            title="Individuals -> Labour Radius"
            description="Maximum distance (in km) to notify labourers about a new individual booking"
            accent="indigo-600"
          >
            <div>
              <label className={labelClass}>Radius (in kilometers)</label>
              <input
                className={inputClass + ' mt-1.5'}
                type="number"
                min={1}
                max={500}
                placeholder="e.g. 10"
                value={bookingBroadcastRadius}
                onChange={(e) => setBookingBroadcastRadius(e.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">
                A larger radius increases matching chances but may increase travel time for workers.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Target}
            title="Contractor -> Vendors Radius"
            description="Maximum distance (in km) to notify vendors about a new contractor request"
            accent="brand"
          >
            <div>
              <label className={labelClass}>Radius (in kilometers)</label>
              <input
                className={inputClass + ' mt-1.5'}
                type="number"
                min={1}
                max={500}
                placeholder="e.g. 50"
                value={b2bBroadcastRadius}
                onChange={(e) => setB2bBroadcastRadius(e.target.value)}
              />
              <p className="mt-2 text-xs text-slate-500">
                Contractor requests typically cover a larger area as vendors are equipped for travel.
              </p>
            </div>
          </SettingsSection>

          <AppPrimaryButton
            type="button"
            loading={saving}
            onClick={handleSave}
            className="w-full"
          >
            Save All Settings
          </AppPrimaryButton>
        </div>

        {/* Right Column: Statistics */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-extrabold text-slate-900">Broadcast Statistics</h2>
          </div>
          
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={BookOpen}
                label="Total Bookings"
                value={stats.totalBookings || 0}
                description="Bookings processed by the system"
              />
              <StatCard
                icon={Users}
                label="Eligible Labourers"
                value={stats.totalEligibleLabourers || 0}
                description="Total labourers matched across bookings"
              />
              <StatCard
                icon={Map}
                label="Average Radius"
                value={stats.avgRadius ? `${stats.avgRadius.toFixed(1)} km` : 'N/A'}
                description="Average distance from customer to labourer"
              />
              <StatCard
                icon={CheckCircle2}
                label="Success Rate"
                value={stats.broadcastSuccessRate ? `${stats.broadcastSuccessRate.toFixed(1)}%` : '0%'}
                description="Percentage of successful broadcasts"
              />
            </div>
          ) : (
            <GlassPanel className="p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">No statistics available yet.</p>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  )
}
