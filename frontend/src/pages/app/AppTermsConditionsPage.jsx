import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { apiRequest } from '../../api/http.js'
import { useAuth } from '../../hooks/useAuth.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'

export function AppTermsConditionsPage() {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    if (!user?.role) return

    setIsLoading(true)
    // Fetch the terms and conditions for the current user's role
    apiRequest(`/policies/terms/${user.role}`)
      .then((res) => {
        if (mounted) setContent(res.data?.content || 'No terms and conditions available.')
      })
      .catch(() => {
        if (mounted) setError('Failed to load terms and conditions.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [user?.role])

  return (
    <div className="mx-auto max-w-3xl pt-2 pb-12">
      <div className="mb-6 px-1">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <FileText className="h-6 w-6 text-brand" />
          Terms & Conditions
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Please read these terms carefully before using our platform.
        </p>
      </div>

      <GlassPanel className="p-5 sm:p-8">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-r-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : (
          <div className="prose prose-sm prose-slate max-w-none">
            {content.split('\\n').map((paragraph, i) => (
              <p key={i} className="mb-4 text-slate-700 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
