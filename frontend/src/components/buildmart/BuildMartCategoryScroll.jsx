import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { fetchAppMartCategories } from '../../api/adminBuildmartApi.js'
import { Package } from 'lucide-react'

export function BuildMartCategoryScroll({ activeId, onSelect }) {
  const reduce = useReducedMotion()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchAppMartCategories()
      .then((res) => {
        const data = res?.data ?? res ?? []
        if (Array.isArray(data)) setCategories(data)
      })
      .catch((err) => console.error('Failed to load mart categories', err))
  }, [])

  return (
    <section aria-label="Material categories">
      <motion.div
        className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`flex shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl px-1 py-1 transition active:scale-95 ${!activeId ? 'opacity-100' : 'opacity-80'
            }`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xs font-black ring-2 transition ${!activeId
                ? 'buildmart-gradient text-white ring-orange-300/50 buildmart-glow scale-105'
                : 'bg-white text-slate-700 ring-slate-200/90 shadow-sm'
              }`}
          >
            All
          </span>
          <span className={`text-[10px] font-bold ${!activeId ? 'text-bm-terracotta' : 'text-slate-500'}`}>
            All
          </span>
        </button>

        {categories.map((cat, i) => {
          const active = activeId === cat.id
          
          let InnerIcon = <Package className="h-6 w-6" aria-hidden />
          const IconStr = cat.icon
          if (IconStr) {
             if (IconStr.startsWith('http') || IconStr.startsWith('/') || IconStr.startsWith('data:')) {
               InnerIcon = <img src={IconStr} alt={cat.name || cat.label} className="h-full w-full object-cover" />
             } else if (Icons[IconStr]) {
               const LucideIcon = Icons[IconStr]
               InnerIcon = <LucideIcon className="h-6 w-6" aria-hidden />
             }
          }
          
          // Use legacy tone or new color. If neither, fallback to a generic style.
          const toneClass = cat.tone || cat.color || 'bg-slate-100 text-slate-800 ring-slate-200/80'

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className="flex shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl px-1 py-1"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              whileTap={reduce ? undefined : { scale: 0.94 }}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ring-2 transition-all duration-300 ${active
                    ? 'buildmart-gradient text-white ring-orange-300/60 buildmart-glow scale-105'
                    : `${toneClass} shadow-sm ring-transparent`
                  }`}
              >
                {InnerIcon}
              </span>
              <span
                className={`max-w-[4.5rem] truncate text-[10px] font-bold ${active ? 'text-bm-terracotta' : 'text-slate-600'
                  }`}
              >
                {cat.name || cat.label}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </section>
  )
}
