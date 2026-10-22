import { useEffect } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import {
  BrickWall,
  Droplets,
  Hammer,
  HardHat,
  IndianRupee,
  Paintbrush,
  ShieldCheck,
  Wrench,
  Zap,
} from 'lucide-react'

const FLOATING_BADGES = [
  {
    id: 'hardhat',
    icon: HardHat,
    label: 'Verified Labour',
    color: 'text-amber-500 bg-amber-50 border-amber-200/80',
    top: '12%',
    left: '2%',
    duration: 6.5,
    delay: 0,
    rotate: [0, 6, -4, 0],
  },
  {
    id: 'zap',
    icon: Zap,
    label: 'Instant Booking',
    color: 'text-blue-600 bg-blue-50 border-blue-200/80',
    top: '22%',
    right: '2%',
    duration: 5.5,
    delay: 0.8,
    rotate: [0, -5, 5, 0],
  },
  {
    id: 'hammer',
    icon: Hammer,
    label: 'Carpentry & Core',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    top: '55%',
    left: '2.5%',
    duration: 7,
    delay: 1.2,
    rotate: [0, 4, -6, 0],
  },
  {
    id: 'droplets',
    icon: Droplets,
    label: 'Plumbing & Water',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200/80',
    top: '72%',
    right: '2.5%',
    duration: 6,
    delay: 0.5,
    rotate: [0, -6, 4, 0],
  },
  {
    id: 'shield',
    icon: ShieldCheck,
    label: 'Aadhaar Verified',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    top: '88%',
    left: '3%',
    duration: 8,
    delay: 1.5,
    rotate: [0, 5, -3, 0],
  },
  {
    id: 'rupee',
    icon: IndianRupee,
    label: 'Fixed Transparent Rates',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    top: '42%',
    right: '1.5%',
    duration: 7.2,
    delay: 2,
    rotate: [0, -4, 6, 0],
  },
]

export function AnimatedServiceBackground() {
  const reduce = useReducedMotion()
  // Pointer parallax via motion values: no React re-render on mousemove
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const x = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.6 })
  const y = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.6 })
  const blobAX = useTransform(x, (v) => v * -0.7)
  const blobAY = useTransform(y, (v) => v * -0.7)
  const blobBX = useTransform(x, (v) => v * 0.8)
  const blobBY = useTransform(y, (v) => v * 0.8)
  const blobCX = useTransform(x, (v) => v * -0.5)
  const blobCY = useTransform(y, (v) => v * -0.5)
  const badgeX = useTransform(x, (v) => v * 0.4)

  useEffect(() => {
    if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined

    function handleMouseMove(e) {
      const { innerWidth, innerHeight } = window
      mouseX.set((e.clientX / innerWidth - 0.5) * 30)
      mouseY.set((e.clientY / innerHeight - 0.5) * 30)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [reduce, mouseX, mouseY])

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Dynamic Ambient Gradient Blobs with subtle parallax */}
      <motion.div
        className="absolute -top-32 left-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-blue-500/12 via-indigo-500/8 to-emerald-400/10 blur-[110px]"
        style={reduce ? undefined : { x: blobAX, y: blobAY }}
        animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-1/3 -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-400/8 to-blue-600/10 blur-[100px]"
        style={reduce ? undefined : { x: blobBX, y: blobBY }}
        animate={reduce ? undefined : { scale: [1.05, 1, 1.05] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute -bottom-20 left-1/3 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-amber-500/8 via-sky-400/8 to-blue-500/10 blur-[110px]"
        style={reduce ? undefined : { x: blobCX, y: blobCY }}
      />

      {/* Blueprint Grid Texture Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#002b5c06_1px,transparent_1px),linear-gradient(to_bottom,#002b5c06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

      {/* Subtle floating service glyphs — only on wide screens where they fit in the side gutters */}
      {!reduce && (
        <motion.div className="hidden min-[1400px]:block" style={{ x: badgeX }}>
          {FLOATING_BADGES.map((item) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                className="absolute"
                style={{
                  top: item.top,
                  left: item.left,
                  right: item.right,
                }}
                animate={{
                  y: [0, -14, 0],
                  rotate: item.rotate,
                }}
                transition={{
                  duration: item.duration,
                  delay: item.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div
                  title={item.label}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg shadow-slate-200/60 backdrop-blur-md ${item.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

