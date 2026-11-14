import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Bell, Share, X } from 'lucide-react'
import { USER_ROLES } from '../../constants/userRoles.js'
import { registerFCMToken, requestNotificationPermission } from '../../services/pushNotificationService.js'

const DISMISS_KEY = 'kaam_job_alerts_banner_dismissed'

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIOS() {
  const ua = window.navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

/**
 * Job-alert setup for workers on phones.
 *  - Android / desktop: a real button (a genuine tap) to allow notifications — the browser only shows the prompt for that.
 *  - iPhone / iPad: web notifications only exist once the site is added to the Home Screen, so explain that first.
 *  - Blocked: explain how to turn it back on.
 */
export function EnableJobAlertsBanner() {
  const user = useSelector((s) => s.auth.user)
  const isWorker = user?.role === USER_ROLES.LABOUR || user?.role === USER_ROLES.CONTRACTOR
  const [permission, setPermission] = useState(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission))
  const [dismissed, setDismissed] = useState(readDismissed)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof Notification === 'undefined') return undefined
    const sync = () => setPermission(Notification.permission)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* storage unavailable */
    }
  }, [])

  const enable = useCallback(async () => {
    setBusy(true)
    try {
      // Ask first, straight from the tap, so the browser accepts the prompt (phones require a real user gesture)
      const granted = await requestNotificationPermission()
      if (typeof Notification !== 'undefined') setPermission(Notification.permission)
      if (granted) await registerFCMToken(true)
    } catch (err) {
      // Permission may still have been granted even if the push token step failed (e.g. Firebase not configured):
      // in-app job notifications work from permission alone.
      console.warn('Push token registration failed', err)
    } finally {
      if (typeof Notification !== 'undefined') setPermission(Notification.permission)
      setBusy(false)
    }
  }, [])

  if (!isWorker || dismissed) return null

  let content = null
  if (isIOS() && !isStandalone()) {
    content = (
      <>
        <Share className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">Get job alerts on your iPhone</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            Tap <span className="font-bold">Share</span> in Safari, choose <span className="font-bold">Add to Home Screen</span>, then open KaamExpert from your Home Screen and tap Enable.
          </p>
        </div>
      </>
    )
  } else if (permission === 'default') {
    content = (
      <>
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">Turn on job alerts</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">Get a notification with sound the moment a new job is near you.</p>
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="mt-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 disabled:opacity-60"
          >
            {busy ? 'Enabling…' : 'Enable job alerts'}
          </button>
        </div>
      </>
    )
  } else if (permission === 'denied') {
    content = (
      <>
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">Job alerts are blocked</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            Open your phone's Settings → Notifications (or the site settings in Chrome) and allow notifications for KaamExpert.
          </p>
        </div>
      </>
    )
  }

  if (!content) return null

  return (
    <div className="fixed inset-x-3 bottom-24 z-[250] mx-auto max-w-md" role="status">
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
        {content}
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-full p-1 text-slate-400 active:scale-95">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
