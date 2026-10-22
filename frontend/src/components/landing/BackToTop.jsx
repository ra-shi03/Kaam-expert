import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    let frame = 0
    let lastY = window.scrollY
    // Show only when the user is scrolling back up (intent to return), so it never sits over content while reading
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY
        if (Math.abs(delta) < 6) return
        setVisible(delta < 0 && y > window.innerHeight * 1.2)
        lastY = y
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9, transition: { duration: 0.18 } }}
          whileHover={reduce ? undefined : { y: -3 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-bright to-brand text-white shadow-lg shadow-brand/30 sm:right-6 sm:bottom-6"
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
