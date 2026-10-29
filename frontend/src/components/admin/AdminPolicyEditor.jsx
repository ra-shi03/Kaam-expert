import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, Eye, Loader2, Pencil, RotateCcw } from 'lucide-react'
import { adminPoliciesApi } from '../../api/adminPoliciesApi.js'
import { getPublicSettings } from '../../api/adminSettingsApi.js'
import { AppPillTabs } from '../app-ui/navigation/AppPillTabs.jsx'
import { LegalDocument } from '../legal/LegalDocument.jsx'
import { LegalSupportView } from '../legal/LegalSupportView.jsx'
import { AUDIENCES, DEFAULT_COMPANY, legalPath } from '../../lib/legalContent.js'

const ALL_TABS = [
  { id: 'customer', label: 'Customer', audience: 'users' },
  { id: 'contractor', label: 'Contractor', audience: 'users' },
  { id: 'labour', label: 'Labour', audience: 'labours' },
]

const PLACEHOLDERS = [
  ['{{company_name}}', 'Brand name'],
  ['{{legal_name}}', 'Company name'],
  ['{{cin}}', 'CIN'],
  ['{{address}}', 'Address'],
  ['{{phone}}', 'Phone'],
  ['{{email}}', 'Email'],
  ['{{website}}', 'Website'],
  ['{{support_hours}}', 'Support hours'],
]

export function AdminPolicyEditor({ type, title, description, roles }) {
  const tabs = useMemo(() => ALL_TABS.filter((t) => !roles || roles.includes(t.id)), [roles])
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [content, setContent] = useState('')
  const [defaultContent, setDefaultContent] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [company, setCompany] = useState(DEFAULT_COMPANY)
  const [mode, setMode] = useState('edit')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const textareaId = `policy-text-${type}`

  useEffect(() => {
    getPublicSettings().then((res) => res.data?.companyInfo && setCompany({ ...DEFAULT_COMPANY, ...res.data.companyInfo })).catch(() => {})
  }, [])

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    setError('')
    adminPoliciesApi
      .getPolicy(type, activeTab)
      .then((res) => {
        if (!mounted) return
        setContent(res?.data?.content || '')
        setDefaultContent(res?.data?.defaultContent || '')
        setIsDefault(Boolean(res?.data?.isDefault))
        setUpdatedAt(res?.data?.updatedAt || null)
      })
      .catch((err) => mounted && setError(err?.message || 'Failed to fetch content.'))
      .finally(() => mounted && setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [type, activeTab])

  const handleSave = async () => {
    setIsSaving(true)
    setIsSuccess(false)
    setError('')
    try {
      const res = await adminPoliciesApi.updatePolicy(type, activeTab, { content })
      setIsDefault(false)
      setUpdatedAt(res?.data?.updatedAt || new Date().toISOString())
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (err) {
      setError(err?.message || 'Failed to save content.')
    } finally {
      setIsSaving(false)
    }
  }

  const insertPlaceholder = (token) => {
    const el = document.getElementById(textareaId)
    const start = el?.selectionStart ?? content.length
    const end = el?.selectionEnd ?? content.length
    setContent(content.slice(0, start) + token + content.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const audience = tabs.find((t) => t.id === activeTab)?.audience ?? 'users'
  const audienceInfo = AUDIENCES[audience]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {description ?? `Edit what customers and labour partners see on the ${title} page. Changes go live as soon as you save.`}
          </p>
        </div>
        <a
          href={legalPath(audience, type)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand/40 hover:text-brand"
        >
          <ExternalLink className="h-4 w-4" /> View live page
        </a>
      </div>

      <AppPillTabs items={tabs} value={activeTab} onChange={setActiveTab} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold capitalize text-slate-900">{activeTab} content</h2>
            <p className="text-xs text-slate-400">
              {isDefault ? 'Showing the standard text — save to make it your own.' : updatedAt ? `Last saved ${new Date(updatedAt).toLocaleString('en-IN')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSuccess ? <span className="flex items-center gap-1 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> Saved</span> : null}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {[['edit', Pencil, 'Edit'], ['preview', Eye, 'Preview']].map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${mode === id ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-600">{error}</div> : null}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand/50" /></div>
        ) : mode === 'preview' ? (
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl bg-slate-50 p-4">
            {type === 'support'
              ? <LegalSupportView content={content} company={company} audienceInfo={audienceInfo} />
              : <LegalDocument content={content} company={company} />}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-bold text-slate-700">Formatting tips</p>
              <p className="mt-1">
                <code className="font-bold">## Heading</code> starts a new section · <code className="font-bold">- item</code> makes a bullet ·{' '}
                <code className="font-bold">**bold**</code> · <code className="font-bold">[text](https://link)</code>.
                {type === 'support' ? ' On the support page every heading becomes a question and the text below it the answer.' : ''}
              </p>
              <p className="mt-2 font-bold text-slate-700">Insert company details (updates automatically)</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map(([token, label]) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertPlaceholder(token)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:border-brand/40 hover:text-brand"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id={textareaId}
              className="min-h-[460px] w-full rounded-xl border border-slate-200 p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder={`Write the ${title} for ${activeTab}…`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => defaultContent && setContent(defaultContent)}
                disabled={!defaultContent}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-brand disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" /> Load standard text
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center justify-center rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-70"
              >
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save content'}
              </button>
            </div>
          </div>
        )}
      </div>

      {type !== 'support' ? (
        <p className="text-xs text-slate-400">
          Company address, CIN, phone and email are managed in <Link to="/admin/support-page" className="font-bold text-brand hover:underline">Support Page</Link>.
        </p>
      ) : null}
    </div>
  )
}
