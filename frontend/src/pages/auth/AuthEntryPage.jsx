import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  HardHat,
  Home,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { MobileShell } from '../../layouts/MobileShell.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { LabourCategorySetup } from '../../components/auth/LabourCategorySetup.jsx'
import { ROLE_LABELS, USER_ROLES } from '../../constants/userRoles.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { requestLoginOtp, requestRegisterOtp, verifyLogin, verifyRegister } from '../../api/authApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { ApiError } from '../../api/http.js'

const ROLE_OPTIONS = [
  {
    role: USER_ROLES.CUSTOMER,
    icon: Home,
    desc: 'Hire verified labour for your home or renovation',
  },
  {
    role: USER_ROLES.CONTRACTOR,
    icon: Building2,
    desc: 'Bulk workforce for sites and projects',
  },
  {
    role: USER_ROLES.LABOUR,
    icon: HardHat,
    desc: 'Get matched to jobs near you',
  },
]

function isValidIndianMobile(digits) {
  return digits.length === 10 && /^[6-9]\d{9}$/.test(digits)
}

const OTP_BYPASS_HINT = import.meta.env.VITE_OTP_BYPASS_HINT === 'true'

function demoOtpFromPhone(digits) {
  if (!digits || digits.length < 6) return null
  return digits.slice(-6)
}

function FeedbackBanner({ variant, children }) {
  if (!children) return null
  const styles =
    variant === 'error'
      ? 'border-amber-200/90 bg-amber-50 text-amber-950 ring-amber-100'
      : 'border-blue-200/90 bg-blue-50 text-slate-950 ring-blue-100'
  return (
    <p role="alert" className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-relaxed ring-1 ${styles}`}>
      {children}
    </p>
  )
}

function AuthField({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
        {hint}
      </div>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 text-base font-medium text-slate-900 shadow-sm outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/25'

export function AuthEntryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applySession } = useAuth()
  const reduce = useReducedMotion()
  const otpInputRefs = useRef([])

  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('form')
  const [role, setRole] = useState(location.state?.defaultRole || USER_ROLES.CUSTOMER)
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [otpCells, setOtpCells] = useState(() => Array(6).fill(''))
  const [challengeId, setChallengeId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState(null)

  const p = isValidIndianMobile(phone) ? phone : null
  const code = otpCells.join('')
  const phoneComplete = phone.length === 10

  function clearOtpError() {
    setBanner((b) => (b?.variant === 'error' ? null : b))
  }

  function digitsToOtpCells(raw) {
    const d = String(raw ?? '').replace(/\D/g, '').slice(0, 6)
    const out = Array(6).fill('')
    for (let k = 0; k < d.length; k++) out[k] = d[k]
    return out
  }

  function handleOtpPaste(e) {
    e.preventDefault()
    const cells = digitsToOtpCells(e.clipboardData.getData('text/plain'))
    setOtpCells(cells)
    clearOtpError()
    const nextEmpty = cells.findIndex((c) => c === '')
    queueMicrotask(() => {
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    })
  }

  useEffect(() => {
    if (step !== 'otp') return
    queueMicrotask(() => {
      otpInputRefs.current[0]?.focus()
    })
  }, [step])

  function setPhoneDigits(value) {
    const digits = String(value).replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
    if (banner?.variant === 'error') setBanner(null)
  }

  function resetFlowToForm() {
    setStep('form')
    setChallengeId(null)
    setBanner(null)
    setOtpCells(Array(6).fill(''))
  }

  function switchMode(next) {
    setMode(next)
    resetFlowToForm()
  }

  async function handleSendOtp() {
    setBanner(null)
    setChallengeId(null)
    if (!isValidIndianMobile(phone)) {
      setBanner({
        variant: 'error',
        message: 'Enter exactly 10 digits starting with 6, 7, 8, or 9.',
      })
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        const res = await requestLoginOtp({ phone: p })
        setChallengeId(res.data?.challengeId ?? null)
      } else {
        if (role === USER_ROLES.CONTRACTOR && !companyName.trim()) {
          setBanner({ variant: 'error', message: 'Company name is required.' })
          setBusy(false)
          return
        }
        if (role === USER_ROLES.CONTRACTOR && !businessName.trim()) {
          setBanner({ variant: 'error', message: 'Business name is required.' })
          setBusy(false)
          return
        }
        const res = await requestRegisterOtp({
          phone: p,
          role,
          fullName: fullName.trim() || undefined,
        })
        setChallengeId(res.data?.challengeId ?? null)
      }
      setOtpCells(Array(6).fill(''))
      setStep('otp')
      setBanner({
        variant: 'success',
        message: OTP_BYPASS_HINT && p
          ? `Demo OTP: enter the last 6 digits of ${p} (${demoOtpFromPhone(p)}).`
          : 'OTP sent. Check SMS — in development it may appear in the server terminal.',
      })
    } catch (e) {
      setBanner({
        variant: 'error',
        message: e instanceof ApiError ? e.message : 'Could not send OTP. Try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp() {
    setBanner(null)
    if (code.length !== 6) {
      setBanner({ variant: 'error', message: 'Enter all 6 digits of the OTP.' })
      return
    }
    if (!challengeId) {
      setBanner({ variant: 'error', message: 'Session expired. Go back and tap Send OTP again.' })
      return
    }
    if (!p) {
      setBanner({ variant: 'error', message: 'Phone number is invalid. Go back and fix it.' })
      return
    }
    setBusy(true)
    try {
      let signedInUser
      if (mode === 'login') {
        const res = await verifyLogin({ phone: p, code, challengeId })
        const { token, user } = res.data
        applySession(token, user)
        signedInUser = user
      } else {
        if (!fullName.trim()) {
          setBanner({ variant: 'error', message: 'Full name is required to complete registration.' })
          setBusy(false)
          return
        }
        const body = {
          phone: p,
          role,
          code,
          challengeId,
          fullName: fullName.trim(),
        }
        if (role === USER_ROLES.CONTRACTOR) {
          body.companyName = companyName.trim()
          if (gstNumber.trim()) body.gstNumber = gstNumber.trim().toUpperCase()
        }
        if (role === USER_ROLES.CONTRACTOR) {
          body.businessName = businessName.trim()
        }
        const res = await verifyRegister(body)
        const { token, user } = res.data
        applySession(token, user)
        signedInUser = user
      }

      const needsWorkSetup =
        signedInUser.role === USER_ROLES.LABOUR && !(signedInUser.labourProfile?.categoryIds?.length > 0)
      if (needsWorkSetup) {
        setStep('work-setup')
        setBanner(null)
      } else {
        const returnPath = location.state?.from || getRoleHomePath(signedInUser.role)
        navigate(returnPath, { replace: true })
      }
    } catch (e) {
      setBanner({
        variant: 'error',
        message: e instanceof ApiError ? e.message : 'Verification failed. Check the code and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  if (step === 'work-setup') {
    return (
      <>
        <MobileShell transparent className="pb-0 pt-4">
          <LabourCategorySetup variant="auth" onComplete={() => {
            const returnPath = location.state?.from || getRoleHomePath(USER_ROLES.LABOUR)
            navigate(returnPath, { replace: true })
          }} />
        </MobileShell>
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand selection:bg-white/20">
      {/* Top Header Section */}
      <div className="relative flex flex-col px-6 pb-14 pt-12 text-white">
        <Link
          to="/"
          className="absolute left-6 top-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="mt-16 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center rounded-2xl bg-white/90 p-3 shadow-lg">
             <img src="/logo-transparent.png" alt="KaamExpert" className="h-8 w-auto" />
          </div>
          <h1 className="text-center text-3xl font-black tracking-tight">
            {step === 'otp' ? 'Verify OTP' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-white/80">
            {step === 'otp' ? 'Secure verification' : mode === 'login' ? 'Sign in to continue' : 'Join KaamExpert today'}
          </p>
        </div>
      </div>

      {/* Bottom Form Section */}
      <div className="flex-1 rounded-t-[2.5rem] bg-slate-50 px-6 pb-12 pt-8 shadow-[0_-12px_40px_rgba(0,0,40,0.12)]">
        <div className="mx-auto max-w-lg">
          <GlassPanel className="mb-6 overflow-hidden border-slate-200/90 p-4 ring-1 ring-slate-100/90">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-bright to-brand text-white shadow-md ring-1 ring-brand/25">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">Sign in with mobile OTP</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  No password — we text a 6-digit code to your Indian mobile number.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
                  Secure · Aadhaar-verified workers
                </p>
              </div>
            </div>
          </GlassPanel>

        {step === 'form' ? (
          <div className="mb-5 flex gap-1 rounded-2xl border border-slate-200/90 bg-white/80 p-1 shadow-sm ring-1 ring-slate-100">
            <button
              type="button"
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${mode === 'login' ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-slate-600 hover:text-slate-900'
                }`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${mode === 'register'
                ? 'bg-brand text-white shadow-md shadow-brand/25'
                : 'text-slate-600 hover:text-slate-900'
                }`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? false : { opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {mode === 'register' ? (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">I am a</p>
                  <div className="grid gap-2">
                    {ROLE_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const active = role === opt.role
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => setRole(opt.role)}
                          className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.99] ${active
                            ? 'border-brand/40 bg-linear-to-r from-brand/10 via-white to-blue-50/40 ring-2 ring-brand/20'
                            : 'border-slate-200/90 bg-white hover:border-brand/25'
                            }`}
                        >
                          <span
                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-900">{ROLE_LABELS[opt.role]}</span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{opt.desc}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {role === USER_ROLES.LABOUR ? (
                    <p className="mt-2 rounded-xl bg-brand/5 px-3 py-2 text-[11px] leading-relaxed text-slate-600 ring-1 ring-brand/15">
                      After OTP, you&apos;ll pick your work areas and roles on this screen.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <GlassPanel className="space-y-4 border-slate-200/90 p-4 ring-1 ring-slate-100/90">
                <AuthField
                  label="Mobile number"
                  hint={
                    mode === 'register' ? (
                      <span className={`text-xs tabular-nums ${phoneComplete ? 'font-bold text-brand' : 'text-slate-400'}`}>
                        {phone.length}/10
                      </span>
                    ) : null
                  }
                >
                  <div
                    className={`flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition focus-within:ring-2 ${banner?.variant === 'error' && phone.length > 0 && !phoneComplete
                      ? 'ring-amber-300'
                      : 'focus-within:ring-brand/30'
                      }`}
                  >
                    <span className="flex items-center border-r border-slate-100 bg-slate-50 px-3.5 text-sm font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      id="auth-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      placeholder="9876543210"
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-lg font-semibold tracking-wide text-slate-900 outline-none"
                      value={phone}
                      onChange={(e) => setPhoneDigits(e.target.value)}
                      onKeyDown={(e) => {
                        const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
                        if (allowed.includes(e.key)) return
                        if (e.ctrlKey || e.metaKey) return
                        if (!/^\d$/.test(e.key)) e.preventDefault()
                      }}
                    />
                  </div>
                </AuthField>

                {mode === 'register' ? (
                  <>
                    <AuthField label="Full name">
                      <input
                        type="text"
                        className={inputClass}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As on your ID"
                        autoComplete="name"
                      />
                    </AuthField>
                    {role === USER_ROLES.CONTRACTOR ? (
                      <>
                        <AuthField label="Company name">
                          <input
                            type="text"
                            className={inputClass}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </AuthField>
                        <AuthField label="GST (optional)">
                          <input
                            type="text"
                            maxLength={15}
                            className={inputClass}
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                          />
                        </AuthField>
                      </>
                    ) : null}
                    {role === USER_ROLES.CONTRACTOR ? (
                      <AuthField label="Business name">
                        <input
                          type="text"
                          className={inputClass}
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </AuthField>
                    ) : null}
                  </>
                ) : null}
              </GlassPanel>

              <FeedbackBanner variant={banner?.variant}>{banner?.message}</FeedbackBanner>
              <AppPrimaryButton type="button" disabled={busy} className="w-full py-3.5 text-[15px]" onClick={() => void handleSendOtp()}>
                {busy ? 'Please wait…' : 'Send OTP'}
                <Phone className="h-4 w-4" aria-hidden />
              </AppPrimaryButton>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? false : { opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <GlassPanel className="border-slate-200/90 p-4 ring-1 ring-slate-100/90">
                <p className="text-sm text-slate-600">
                  Code sent to{' '}
                  <span className="font-bold tabular-nums text-slate-900">+91 {phone}</span>
                </p>
                {OTP_BYPASS_HINT && p ? (
                  <p className="mt-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand">
                    Demo: OTP is the last 6 digits of your number ({demoOtpFromPhone(p)}).
                  </p>
                ) : null}
                <p className="mt-4 mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Enter OTP</p>
                <div className="flex gap-2" onPaste={handleOtpPaste}>
                  {otpCells.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpInputRefs.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      aria-label={`OTP digit ${i + 1} of 6`}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200/90 bg-white py-4 text-center font-mono text-xl font-bold tabular-nums text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-brand/35"
                      value={digit}
                      onPaste={handleOtpPaste}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '').slice(-1)
                        const next = [...otpCells]
                        if (d) {
                          next[i] = d
                          setOtpCells(next)
                          clearOtpError()
                          if (i < 5) otpInputRefs.current[i + 1]?.focus()
                        } else {
                          next[i] = ''
                          setOtpCells(next)
                          clearOtpError()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (!busy) void handleVerifyOtp()
                          return
                        }
                        if (e.key === 'Backspace') {
                          e.preventDefault()
                          if (otpCells[i]) {
                            const next = [...otpCells]
                            next[i] = ''
                            setOtpCells(next)
                            clearOtpError()
                          } else if (i > 0) {
                            const next = [...otpCells]
                            next[i - 1] = ''
                            setOtpCells(next)
                            clearOtpError()
                            otpInputRefs.current[i - 1]?.focus()
                          }
                          return
                        }
                        if (e.key === 'ArrowLeft' && i > 0) {
                          e.preventDefault()
                          otpInputRefs.current[i - 1]?.focus()
                          return
                        }
                        if (e.key === 'ArrowRight' && i < 5) {
                          e.preventDefault()
                          otpInputRefs.current[i + 1]?.focus()
                          return
                        }
                        if (e.ctrlKey || e.metaKey) return
                        if (!/^\d$/.test(e.key) && e.key.length === 1) e.preventDefault()
                      }}
                    />
                  ))}
                </div>
              </GlassPanel>

              <FeedbackBanner variant={banner?.variant}>{banner?.message}</FeedbackBanner>
              <AppPrimaryButton
                type="button"
                disabled={busy}
                className="w-full py-3.5 text-[15px]"
                onClick={() => void handleVerifyOtp()}
              >
                {busy ? 'Verifying…' : mode === 'login' ? 'Verify & login' : 'Verify & continue'}
                <User className="h-4 w-4" aria-hidden />
              </AppPrimaryButton>
              <button
                type="button"
                className="w-full py-2 text-sm font-bold text-brand"
                onClick={resetFlowToForm}
              >
                Edit mobile number
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
