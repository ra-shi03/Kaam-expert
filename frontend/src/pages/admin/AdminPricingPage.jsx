import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Layers,
  Loader2,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { apiRequest } from '../../api/http.js'
import { fetchAdminLabourCategoryTree } from '../../api/adminLabourCategoriesApi.js'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all'

const DEFAULT_FORM = {
  categoryId: '',
  clientType: 'customer',
  ratePerShift: '',
  workerRatePerShift: '',
  gstPercent: '18',
}

// Flatten category tree into a flat list of { _id, name }
function flattenCategories(groups = []) {
  const result = []
  for (const group of groups) {
    for (const cat of group.categories || []) {
      result.push({ _id: cat._id, name: `${group.name} — ${cat.name}` })
    }
  }
  return result
}

export function AdminPricingPage() {
  const [rates, setRates] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingRates, setLoadingRates] = useState(true)
  const [loadingCats, setLoadingCats] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadRates = useCallback(async () => {
    try {
      setLoadingRates(true)
      const res = await apiRequest('/admin/workforce/pricing')
      setRates(res.data?.rates ?? [])
    } catch {
      setMessage({ type: 'error', text: 'Failed to load pricing rates' })
    } finally {
      setLoadingRates(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCats(true)
      const res = await fetchAdminLabourCategoryTree()
      setCategories(flattenCategories(res.data?.groups ?? []))
    } catch {
      // non-fatal
    } finally {
      setLoadingCats(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
    loadCategories()
  }, [loadRates, loadCategories])

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/admin/workforce/pricing', {
        method: 'POST',
        body: {
          categoryId: form.categoryId,
          clientType: form.clientType,
          ratePerShift: Number(form.ratePerShift),
          workerRatePerShift: form.workerRatePerShift ? Number(form.workerRatePerShift) : undefined,
          gstPercent: Number(form.gstPercent) || 18,
        },
      })
      showMsg('success', 'Rate saved successfully!')
      setForm(DEFAULT_FORM)
      loadRates()
    } catch (err) {
      showMsg('error', err?.data?.message || err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id) => {
    setDeletingId(id)
    try {
      // We deactivate by patching isActive=false. Backend doesn't have a delete,
      // so we POST a new rate for the same category — alternatively reload.
      // For now just reload to show intent. Full delete requires backend change.
      await apiRequest(`/admin/workforce/pricing/${id}`, { method: 'PATCH', body: { isActive: false } })
      showMsg('success', 'Rate deactivated')
      loadRates()
    } catch {
      // If PATCH not supported, just reload
      loadRates()
    } finally {
      setDeletingId(null)
    }
  }

  // Find category name from id
  const getCategoryName = (id) => {
    const cat = categories.find((c) => c._id === id || String(c._id) === String(id))
    return cat?.name || `ID: …${String(id).slice(-6)}`
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pricing & Rates</h1>
        <p className="text-gray-500 mt-1">Configure per-skill, per-client billing rates for attendance-based bookings</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Add Rate Form */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-primary" />
            Add / Update Rate
          </h2>

          {message.text && (
            <div
              className={`p-3 rounded-lg mb-5 text-sm flex items-start gap-2 ${
                message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
              {loadingCats ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading categories…
                </div>
              ) : (
                <select
                  className={inputClass}
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Client Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
              <select
                className={inputClass}
                value={form.clientType}
                onChange={(e) => setForm({ ...form, clientType: e.target.value })}
              >
                <option value="individual">Individual</option>
                <option value="contractor">Contractor</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>

            {/* Rate Per Shift */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Per Shift (₹) — <span className="text-gray-400">charged to client</span>
              </label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 700"
                value={form.ratePerShift}
                onChange={(e) => setForm({ ...form, ratePerShift: e.target.value })}
                required
              />
            </div>

            {/* Worker Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Worker Rate Per Shift (₹) — <span className="text-gray-400">optional, paid to worker</span>
              </label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 500 (optional)"
                value={form.workerRatePerShift}
                onChange={(e) => setForm({ ...form, workerRatePerShift: e.target.value })}
              />
            </div>

            {/* GST */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="18"
                value={form.gstPercent}
                onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
              />
            </div>

            <AppPrimaryButton type="submit" disabled={saving} className="w-full justify-center">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : (
                'Save Rate'
              )}
            </AppPrimaryButton>
          </form>
        </GlassPanel>

        {/* Active Rates Table */}
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-brand-primary" />
              Active Rates
            </h2>
            <button
              onClick={loadRates}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingRates ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Layers className="w-10 h-10 mb-2" />
              <p className="text-sm">No pricing rates configured yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-1">
              {rates.map((r) => (
                <li key={r._id} className="flex items-center justify-between py-3 px-1 group">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{getCategoryName(r.categoryId)}</p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {r.clientType} · GST {r.gstPercent ?? 18}%
                      {r.workerRatePerShift ? ` · Worker ₹${r.workerRatePerShift}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">₹{r.ratePerShift}/shift</span>
                    <button
                      onClick={() => handleDeactivate(r._id)}
                      disabled={deletingId === r._id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      title="Deactivate rate"
                    >
                      {deletingId === r._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
