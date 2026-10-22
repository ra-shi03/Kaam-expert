import { motion, useReducedMotion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

export function Reveal({
  as = 'div',
  children,
  className = '',
  delay = 0,
  y = 28,
  x = 0,
  scale = 1,
  duration = 0.6,
  once = true,
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, amount: 0.15, margin: '0px 0px -60px 0px' }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </MotionTag>
  )
}
