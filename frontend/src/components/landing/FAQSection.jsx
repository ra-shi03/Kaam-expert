import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { faqs } from '../../data/landingContent'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'

export function FAQSection() {
  const [open, setOpen] = useState(0)
  const reduce = useReducedMotion()
  const baseId = useId()

  return (
    <section id="faq" className="bg-page py-16 sm:py-20" aria-labelledby="faq-heading">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            titleId="faq-heading"
            eyebrow="FAQ"
            title="Answers before you book"
            subtitle="Still deciding? Here’s what teams usually ask before their first KaamExpert shift."
            align="center"
          />

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = open === index
              const panelId = `${baseId}-panel-${index}`
              const headerId = `${baseId}-header-${index}`

              return (
                <Reveal key={item.q} delay={index * 0.04}>
                  <div
                    className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                      isOpen
                        ? 'border-brand/40 shadow-md shadow-brand/5'
                        : 'border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <h3>
                      <button
                        type="button"
                        id={headerId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className={`flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left text-[15px] font-semibold transition-colors duration-200 sm:px-5 sm:text-sm ${
                          isOpen ? 'text-brand' : 'text-slate-900 hover:text-brand'
                        }`}
                        onClick={() => setOpen(isOpen ? -1 : index)}
                      >
                        {item.q}
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: reduce ? 0 : 0.25 }}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                            isOpen ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" aria-hidden />
                        </motion.span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={headerId}
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <motion.p
                            initial={reduce ? false : { y: -6 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                            className="border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-600 sm:px-5"
                          >
                            {item.a}
                          </motion.p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
