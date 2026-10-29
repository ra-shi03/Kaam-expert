import { useEffect, useState } from 'react'
import { legalApi } from '../api/legalApi.js'
import { getPublicSettings } from '../api/adminSettingsApi.js'
import { DEFAULT_COMPANY } from '../lib/legalContent.js'

/** Loads a policy (privacy / terms / support) for a role together with the company details. */
export function useLegalContent(type, role) {
  const [state, setState] = useState({ key: '', content: '', updatedAt: null, error: '' })
  const [company, setCompany] = useState(DEFAULT_COMPANY)

  useEffect(() => {
    let alive = true
    getPublicSettings()
      .then((res) => {
        if (alive && res.data?.companyInfo) setCompany({ ...DEFAULT_COMPANY, ...res.data.companyInfo })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    const key = `${type}:${role}`
    legalApi
      .getPolicy(type, role)
      .then((res) => {
        if (alive) setState({ key, content: res.data?.content ?? '', updatedAt: res.data?.updatedAt ?? null, error: '' })
      })
      .catch(() => {
        if (alive) setState({ key, content: '', updatedAt: null, error: 'We could not load this page. Please try again.' })
      })
    return () => {
      alive = false
    }
  }, [type, role])

  const loading = state.key !== `${type}:${role}`
  return { content: state.content, updatedAt: state.updatedAt, error: loading ? '' : state.error, loading, company }
}
