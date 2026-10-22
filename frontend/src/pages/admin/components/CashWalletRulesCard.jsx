import { useState } from 'react'
import { AlertCircle, CheckCircle2, Wallet } from 'lucide-react'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../../components/app/AppPrimaryButton.jsx'
import { adminSettingsApi } from '../../../api/adminSettingsApi.js'
import { ApiError } from '../../../api/http.js'

const inputClass =
  'w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand font-semibold text-slate-800'

function RupeeInput({ label, hint, value, onChange, min = 0 }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
        <input type="number" min={min} step="1" required value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

/** Rapido-style prepaid rule for individual labour cash jobs */
export function CashWalletRulesCard({ settings, onSaved }) {
  const cw = settings?.cashWallet || {}
  const [form, setForm] = useState(() => ({
    isEnabled: cw.isEnabled ?? true,
    minBalance: String(cw.minBalance ?? 0),
    minRecharge: String(cw.minRecharge ?? 100),
    maxRecharge: String(cw.maxRecharge ?? 10000),
  }))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await adminSettingsApi.updateCashWalletSettings({
        isEnabled: form.isEnabled,
        minBalance: Number(form.minBalance),
        minRecharge: Number(form.minRecharge),
        maxRecharge: Number(form.maxRecharge),
      })
      setMsg({ type: 'success', text: 'Cash wallet rules saved' })
      onSaved?.()
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassPanel className="p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="text-lg font-bold text-slate-800">Prepaid Cash Wallet</h2>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.isEnabled}
          aria-label="Require wallet balance for cash jobs"
          onClick={() => set('isEnabled')(!form.isEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${form.isEnabled ? 'bg-brand' : 'bg-slate-200'}`}
        >
          <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <p className="mb-5 text-sm text-slate-600">
        Like Rapido: a labourer must recharge their wallet first. They can accept an individual cash job only if their wallet
        covers that job’s platform fee (+ the minimum balance). The fee is deducted automatically when the customer confirms
        the cash payment. {form.isEnabled ? '' : 'Rule is OFF — cash jobs can be accepted with any balance (fees still become dues).'}
      </p>

      {msg ? (
        <div className={`mb-5 flex items-center gap-3 rounded-xl border p-3 ${msg.type === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
          {msg.type === 'error' ? <AlertCircle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          <p className="text-sm font-semibold">{msg.text}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <RupeeInput
          label="Minimum balance after fee (₹)"
          hint="Extra buffer that must remain in the wallet after a cash job’s fee"
          value={form.minBalance}
          onChange={set('minBalance')}
        />
        <div className="grid grid-cols-2 gap-3">
          <RupeeInput label="Min recharge" value={form.minRecharge} onChange={set('minRecharge')} min={1} />
          <RupeeInput label="Max recharge" value={form.maxRecharge} onChange={set('maxRecharge')} min={1} />
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <AppPrimaryButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Rules'}
          </AppPrimaryButton>
        </div>
      </form>
    </GlassPanel>
  )
}
