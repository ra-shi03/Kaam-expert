import { useEffect, useState } from 'react'
import { Building2, Check, Loader2 } from 'lucide-react'
import { adminSettingsApi, getPublicSettings } from '../../api/adminSettingsApi.js'
import { DEFAULT_COMPANY } from '../../lib/legalContent.js'

const FIELDS = [
  { key: 'brandName', label: 'Brand name', hint: 'Shown in headings, e.g. Kaam Expert' },
  { key: 'legalName', label: 'Registered company name', hint: 'Exact name as per your incorporation certificate' },
  { key: 'cin', label: 'CIN', hint: 'Corporate Identification Number' },
  { key: 'phone', label: 'Customer care number', hint: '10-digit number' },
  { key: 'email', label: 'Company email', hint: 'Used for support and grievances', type: 'email' },
  { key: 'website', label: 'Website', hint: 'https://kaamexpert.in' },
  { key: 'supportHours', label: 'Support hours', hint: 'e.g. Monday to Saturday, 9:00 AM – 7:00 PM' },
  { key: 'address', label: 'Registered office address', hint: 'Shown on every legal page', wide: true },
]

export function CompanyInfoCard() {
  const [form, setForm] = useState(DEFAULT_COMPANY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    getPublicSettings()
      .then((res) => alive && res.data?.companyInfo && setForm({ ...DEFAULT_COMPANY, ...res.data.companyInfo }))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await adminSettingsApi.updateCompanyInfo(form)
      if (res.data?.companyInfo) setForm({ ...DEFAULT_COMPANY, ...res.data.companyInfo })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err?.message || 'Could not save company details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand" aria-hidden />
        <h2 className="text-lg font-bold text-slate-900">Company details</h2>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        These details appear on the Privacy Policy, Terms &amp; Conditions and Support pages for customers and labour partners.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.wide ? 'sm:col-span-2' : ''}`}>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{f.label}</span>
            {f.wide ? (
              <textarea
                rows={2}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            )}
            <span className="mt-1 block text-[11px] text-slate-400">{f.hint}</span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="mt-5 flex items-center justify-end gap-3">
        {saved ? <span className="flex items-center gap-1 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> Saved</span> : null}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-70"
        >
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save details'}
        </button>
      </div>
    </form>
  )
}
