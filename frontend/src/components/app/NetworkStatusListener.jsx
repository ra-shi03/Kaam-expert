import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function NetworkStatusListener() {
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false))
  const [isSlow, setIsSlow] = useState(false)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
      setShowRestored(true)
      const t = setTimeout(() => setShowRestored(false), 2500)
      return () => clearTimeout(t)
    }

    function handleOffline() {
      setIsOffline(true)
      setShowRestored(false)
    }

    function checkConnectionSpeed() {
      const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection
      if (conn) {
        const slow =
          conn.effectiveType === 'slow-2g' ||
          conn.effectiveType === '2g' ||
          (conn.downlink > 0 && conn.downlink < 0.25)
        setIsSlow(slow)
      }
    }

    // Prevent Vite dynamic chunk preload errors from crashing the page during network drops
    function handlePreloadError(e) {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('vite:preloadError', handlePreloadError)

    const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection
    if (conn) {
      checkConnectionSpeed()
      conn.addEventListener('change', checkConnectionSpeed)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('vite:preloadError', handlePreloadError)
      if (conn) conn.removeEventListener('change', checkConnectionSpeed)
    }
  }, [])

  if (showRestored) {
    return (
      <aside
        aria-live="polite"
        className="pointer-events-none fixed top-2 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="flex items-center gap-2 rounded-full bg-emerald-600/95 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
          <Wifi className="h-3.5 w-3.5 text-white" />
          <span>Back online</span>
        </div>
      </aside>
    )
  }

  if (isOffline || isSlow) {
    return (
      <aside
        aria-live="polite"
        className="pointer-events-none fixed top-2 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md ring-1 ring-amber-400/40">
          <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>{isOffline ? 'No internet connection' : 'Slow internet connection'} — staying on this page</span>
        </div>
      </aside>
    )
  }

  return null
}
