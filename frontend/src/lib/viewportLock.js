/** Routes that keep normal document scrolling (marketing / public web pages / admin dashboard). */
export function isDocumentScrollPath(pathname) {
  return (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/r/') ||
    /\/(privacy-policy|terms-and-conditions|support)$/.test(pathname) && !pathname.startsWith('/app')
  )
}

/** The element that scrolls on app routes (falls back to the window elsewhere). */
export function scrollAppToTop(behavior = 'auto') {
  const root = document.getElementById('root')
  if (document.documentElement.classList.contains('app-locked') && root) {
    root.scrollTo({ top: 0, left: 0, behavior })
  } else {
    window.scrollTo({ top: 0, left: 0, behavior })
  }
}

/** Blocks pinch, double-tap and ctrl+wheel/keyboard zoom everywhere. */
export function installZoomGuards() {
  const prevent = (e) => e.preventDefault()
  const opts = { passive: false }

  document.addEventListener('gesturestart', prevent, opts)
  document.addEventListener('gesturechange', prevent, opts)
  document.addEventListener('gestureend', prevent, opts)

  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault()
    },
    opts,
  )

  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) e.preventDefault()
      lastTouchEnd = now
    },
    opts,
  )

  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) e.preventDefault()
    },
    opts,
  )

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault()
  })

  // Block copy / cut / context menu outside editable fields
  const isEditable = (t) =>
    t instanceof Element && !!t.closest('input, textarea, select, [contenteditable="true"], .allow-select')
  document.addEventListener('copy', (e) => !isEditable(e.target) && e.preventDefault())
  document.addEventListener('cut', (e) => !isEditable(e.target) && e.preventDefault())
  document.addEventListener('contextmenu', (e) => !isEditable(e.target) && e.preventDefault())
  document.addEventListener('dragstart', (e) => !isEditable(e.target) && e.preventDefault())
}

/**
 * Keyboard handling (iOS Safari especially):
 *  - exposes the on-screen keyboard height as --kb-inset so scroll containers can pad for it
 *  - scrolls the focused field into view (centered) inside its scroll container
 *  - snaps the page back after the keyboard closes so it never stays shifted
 */
export function installKeyboardGuards() {
  const root = document.documentElement
  const vv = window.visualViewport
  const isField = (t) => t instanceof Element && t.matches('input, textarea, select, [contenteditable="true"]')

  const syncInset = () => {
    if (!vv) return
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    root.style.setProperty('--kb-inset', `${inset}px`)
  }
  vv?.addEventListener('resize', syncInset)
  vv?.addEventListener('scroll', syncInset)

  let timer = 0
  document.addEventListener('focusin', (e) => {
    if (!isField(e.target)) return
    const el = e.target
    clearTimeout(timer)
    // wait for the keyboard animation, then centre the field
    timer = window.setTimeout(() => {
      syncInset()
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }, 320)
  })

  document.addEventListener('focusout', () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (isField(document.activeElement)) return
      root.style.setProperty('--kb-inset', '0px')
      // iOS can leave the window shifted after the keyboard closes
      window.scrollTo(0, 0)
    }, 150)
  })
}
