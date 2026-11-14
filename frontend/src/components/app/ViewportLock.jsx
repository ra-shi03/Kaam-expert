import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isDocumentScrollPath, scrollAppToTop } from '../../lib/viewportLock.js'

/** Toggles the locked-viewport mode on <html> per route and resets scroll on navigation. */
export function ViewportLock() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const locked = !isDocumentScrollPath(pathname)
    document.documentElement.classList.toggle('app-locked', locked)
    scrollAppToTop('auto')
  }, [pathname])

  return null
}
