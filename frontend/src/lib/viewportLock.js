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
 * Keyboard handling (iOS Safari & Android Chrome):
 *  - detects virtual keyboard on touch screens and exposes --kb-inset
 *  - toggles html.keyboard-open to cleanly hide floating bottom bars and footers
 *  - adjusts scroll only if focused field is obscured
 *  - snaps viewport back after keyboard dismissal
 */
export function installKeyboardGuards() {
  const root = document.documentElement
  const vv = window.visualViewport
  const isField = (t) =>
    t instanceof Element &&
    t.matches(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]), textarea, select, [contenteditable="true"]',
    )

  let initialInnerHeight = window.innerHeight

  const isTouchDevice = () =>
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0

  const syncInset = () => {
    let inset = 0
    if (vv) {
      inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    }
    root.style.setProperty('--kb-inset', `${inset}px`)

    const activeField = document.activeElement && isField(document.activeElement)
    const heightDrop = Math.max(0, initialInnerHeight - window.innerHeight)
    const isKeyboardOpen =
      (Boolean(activeField) && isTouchDevice()) ||
      inset > 100 ||
      heightDrop > 120

    root.classList.toggle('keyboard-open', Boolean(isKeyboardOpen))
  }

  window.addEventListener('resize', () => {
    if (!document.activeElement || !isField(document.activeElement)) {
      initialInnerHeight = window.innerHeight
    }
    syncInset()
  })

  vv?.addEventListener('resize', syncInset)
  vv?.addEventListener('scroll', syncInset)

  let timer = 0
  document.addEventListener('focusin', (e) => {
    if (!isField(e.target)) return
    const el = e.target
    // Instantly hide bottom bars on mobile touch devices
    if (isTouchDevice()) {
      root.classList.add('keyboard-open')
    }
    clearTimeout(timer)
    // Wait for the virtual keyboard to slide in, then adjust scroll
    timer = window.setTimeout(() => {
      syncInset()
      const blockPref = el.dataset?.scrollBlock || el.closest?.('[data-scroll-block]')?.dataset?.scrollBlock
      if (blockPref === 'start') {
        const target = el.closest?.('[data-auth-field]') || el
        const scrollContainer = document.getElementById('root') || document.documentElement
        const currentScroll = scrollContainer === document.documentElement ? window.scrollY : scrollContainer.scrollTop
        const targetTop = Math.max(0, currentScroll + target.getBoundingClientRect().top - 16)
        if (scrollContainer.scrollTo) {
          scrollContainer.scrollTo({ top: targetTop, behavior: 'smooth' })
        } else {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }
      } else {
        const rect = el.getBoundingClientRect()
        const availableHeight = vv ? vv.height : window.innerHeight
        if (rect.bottom > availableHeight - 16 || rect.top < 16) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }
    }, 280)
  })

  document.addEventListener('focusout', () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (isField(document.activeElement)) return
      root.style.setProperty('--kb-inset', '0px')
      root.classList.remove('keyboard-open')
      // Reset scroll position after keyboard closes
      window.scrollTo(0, 0)
    }, 150)
  })
}
