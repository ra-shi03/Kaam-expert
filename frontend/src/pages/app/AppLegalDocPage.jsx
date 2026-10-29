import { FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useLegalContent } from '../../hooks/useLegalContent.js'
import { LegalDocument } from '../../components/legal/LegalDocument.jsx'

const META = {
  privacy: { icon: ShieldCheck, title: 'Privacy Policy', blurb: 'How we collect, use and protect your information.' },
  terms: { icon: FileText, title: 'Terms & Conditions', blurb: 'The rules for using Kaam Expert.' },
}

/** Logged-in view of the same admin-managed content shown on the public pages. */
export function AppLegalDocPage({ type }) {
  const { user } = useAuth()
  const meta = META[type]
  const Icon = meta.icon
  const { content, updatedAt, loading, error, company } = useLegalContent(type, user?.role ?? 'customer')

  return (
    <div className="mx-auto max-w-3xl pb-12 pt-2">
      <div className="mb-6 px-1">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <Icon className="h-6 w-6 text-brand" /> {meta.title}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {meta.blurb}
          {updatedAt ? ` Last updated ${new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}
        </p>
      </div>
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-r-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600">{error}</div>
      ) : (
        <LegalDocument content={content} company={company} />
      )}
    </div>
  )
}
