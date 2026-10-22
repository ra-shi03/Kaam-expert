import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { BONUS_TYPE_CONFIG } from './BonusTypePill.jsx'

const OPTIONS = Object.values(BONUS_TYPE_CONFIG)

export function BonusTypeSelect({ value, onChange, id = 'bonus-type' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = BONUS_TYPE_CONFIG[value] || OPTIONS[0]
  const SelectedIcon = selectedOption.icon

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function selectOption(val) {
    onChange?.(val)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input to ensure accessibility and form binding */}
      <input type="hidden" id={id} name="bonusType" value={value} />

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex h-[42px] w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3 text-left transition-all outline-none ${
          isOpen
            ? 'border-brand ring-2 ring-brand/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors ${selectedOption.iconBg}`}>
            <SelectedIcon className="h-4 w-4" aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold text-slate-900">
            {selectedOption.label}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
            isOpen ? 'rotate-180 text-brand' : ''
          }`}
          aria-hidden
        />
      </button>

      {/* Animated Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-1.5 w-[310px] sm:w-[350px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-slate-950/5"
          >
            <div className="max-h-72 space-y-1 overflow-y-auto pr-0.5">
              {OPTIONS.map((opt) => {
                const isSelected = opt.value === value
                const Icon = opt.icon

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(opt.value)}
                    className={`group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all outline-none ${
                      isSelected
                        ? 'bg-brand/5 ring-1 ring-brand/20'
                        : 'hover:bg-slate-50 focus:bg-slate-50'
                    }`}
                  >
                    {/* Icon container */}
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${opt.iconBg}`}>
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>

                    {/* Text and description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-brand' : 'text-slate-900'}`}>
                          {opt.label}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${opt.iconBg}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-normal leading-tight text-slate-500 line-clamp-1">
                        {opt.desc}
                      </p>
                    </div>

                    {/* Checkmark icon */}
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-xs">
                          <Check className="h-3 w-3 stroke-[3]" aria-hidden />
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

