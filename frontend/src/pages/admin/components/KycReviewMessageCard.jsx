import { useEffect, useState } from 'react'
import { GlassPanel } from '../../../components/ui/GlassPanel.jsx'
import { adminSettingsApi, getPublicSettings } from '../../../api/adminSettingsApi.js'

/** Text labourers see under "Submitted for review" on their KYC screen */
export function KycReviewMessageCard() {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    getPublicSettings()
      .then((res) => {
        const msg = res.data?.kycReviewMessage ?? ''
        setValue(msg)
        setSaved(msg)
      })
      .catch(() => {})
  }, [])

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      await adminSettingsApi.updateKycReviewMessage(value.trim())
      setSaved(value.trim())
      setStatus({ ok: true, text: 'Saved — labourers will see this on their KYC screen.' })
    } catch (err) {
      setStatus({ ok: false, text: err?.message || 'Could not save message' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassPanel className="p-4 md:p-5">
      <form onSubmit={save} className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="kyc-review-message" className="text-sm font-bold text-slate-800">
            KYC review message
          </label>
          <p className="mt-0.5 text-xs text-slate-500">Shown to labourers after they submit KYC, e.g. the expected review time.</p>
          <input
            id="kyc-review-message"
            type="text"
            maxLength={300}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Usually reviewed within 1–2 business days."
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <button
          type="submit"
          disabled={busy || value.trim() === saved}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
      {status ? <p className={`mt-2 text-xs font-semibold ${status.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{status.text}</p> : null}
    </GlassPanel>
  )
}
