import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { adminEmailLogin } from '../../api/authApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useBranding } from '../../context/BrandingContext.jsx'
import { ApiError } from '../../api/http.js'
import { USER_ROLES } from '../../constants/userRoles.js'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const { logoUrl } = useBranding()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      const res = await adminEmailLogin({ email: email.trim(), password })
      const { token, user } = res.data
      if (user.role !== USER_ROLES.ADMIN) {
        setMessage('Access denied: this account does not have administrator privileges.')
        return
      }
      applySession(token, user)
      navigate('/admin', { replace: true })
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Invalid email or password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 selection:bg-brand/30">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl"
      >
        {/* Top Header Section with User App Wave Gradient */}
        <div className="relative flex flex-col items-center bg-linear-to-b from-brand to-brand-bright pb-14 pt-8 text-white">
          {/* Wave SVG transition to white card */}
          <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-[0]">
            <svg
              viewBox="0 0 1440 320"
              className="relative block h-[45px] w-[120%] left-[-10%] sm:h-[60px]"
              preserveAspectRatio="none"
            >
              <path
                fill="#ffffff"
                d="M0,160L48,138.7C96,117,192,75,288,69.3C384,64,480,96,576,128C672,160,768,192,864,186.7C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Admin Badge */}
            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-xs backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Portal
            </span>

            {/* Brand Logo */}
            <img
              src={logoUrl || '/logo-transparent.png'}
              alt="KaamExpert"
              className="h-20 w-auto object-contain drop-shadow-md sm:h-24"
            />
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white px-7 pb-8 pt-2">
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Welcome Back</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Sign in to access your administrative controls
            </p>
          </div>

          {message ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{message}</span>
            </motion.div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email Field */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="admin@kaamexpert.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 placeholder:font-medium placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field with Hide / Unhide Eye Icon */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 placeholder:font-medium placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 transition-transform active:scale-90" />
                  ) : (
                    <Eye className="h-5 w-5 transition-transform active:scale-90" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition active:scale-[0.99] hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean Security Note (Replacing legacy external links) */}
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-center text-[11px] font-semibold text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Authorized personnel only · 256-bit SSL encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
