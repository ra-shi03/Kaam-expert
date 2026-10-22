import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from './Reveal'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  dark = false,
  titleId,
}) {
  const reduce = useReducedMotion()
  const centered = align === 'center'
  const alignCls = centered ? 'text-center mx-auto' : ''

  return (
    <div className={`mb-10 max-w-3xl space-y-3 md:mb-14 ${alignCls}`}>
      {eyebrow ? (
        <Reveal y={12}>
          <p
            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              dark ? 'text-brand-bright/95' : 'text-brand'
            }`}
          >
            <motion.span
              aria-hidden
              className="h-px w-6 origin-left bg-current"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
            {eyebrow}
            {centered ? (
              <motion.span
                aria-hidden
                className="h-px w-6 origin-right bg-current"
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
          </p>
        </Reveal>
      ) : null}
      <Reveal delay={0.06}>
        <h2
          id={titleId}
          className={`text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl md:text-[2.5rem] ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {subtitle ? (
        <Reveal delay={0.12}>
          <p
            className={`text-base leading-relaxed md:text-lg ${
              dark ? 'text-zinc-400' : 'text-slate-600'
            }`}
          >
            {subtitle}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}
