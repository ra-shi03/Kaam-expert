import { useEffect, useState } from 'react'
import { getPublicSettings } from '../api/adminSettingsApi.js'

/** Shared across components so the nav, profile and signup screens make one request per page load */
let cached = null
let inflight = null

function loadReferralProgram() {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = getPublicSettings()
      .then((res) => {
        const r = res.data?.referral || {}
        cached = { isEnabled: r.isEnabled ?? true, showInApp: r.showInApp ?? true }
        return cached
      })
      // Fall back to the old always-visible behaviour rather than hiding the feature on a network blip
      .catch(() => ({ isEnabled: true, showInApp: true }))
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/**
 * Admin-controlled visibility of Refer & earn in the app.
 * `loaded` is false until settings arrive; entry points stay hidden until then to avoid a flash.
 */
export function useReferralProgram() {
  const [state, setState] = useState(() => (cached ? { ...cached, loaded: true } : { isEnabled: true, showInApp: false, loaded: false }))

  useEffect(() => {
    if (cached) return
    let mounted = true
    loadReferralProgram().then((cfg) => {
      if (mounted) setState({ ...cfg, loaded: true })
    })
    return () => {
      mounted = false
    }
  }, [])

  return state
}
