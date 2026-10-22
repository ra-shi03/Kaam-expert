import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Gift, HardHat, Home, Loader2 } from 'lucide-react'
import { referralsApi } from '../api/referralsApi.js'
import { useAuth } from '../hooks/useAuth.js'
import { useBranding } from '../context/BrandingContext.jsx'
import { USER_ROLES } from '../constants/userRoles.js'
import { getRoleHomePath } from '../lib/roleHomePath.js'
import { normalizeReferralCode, savePendingReferralCode } from '../lib/referralStorage.js'

function JoinCard({ to, icon: Icon, title, desc, highlighted }) {
  return (
    <Link
      to={to}
      className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 transition active:scale-[0.99] ${
        highlighted
          ? 'border-brand bg-brand/5 ring-1 ring-brand shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold text-slate-900">{title}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand" aria-hidden />
    </Link>
  )
}

export function ReferralLandingPage() {
  const { code: rawCode } = useParams()
  const code = normalizeReferralCode(rawCode)
  const { realUser } = useAuth()
  const { logoUrl } = useBranding()
  const reduce = useReducedMotion()

  const [result, setResult] = useState({ status: 'loading', info: null, message: '' })

  useEffect(() => {
    if (!code) return undefined
    let cancelled = false
    referralsApi
      .validateCode(code)
      .then((res) => {
        if (cancelled) return
        savePendingReferralCode(code)
        setResult({ status: 'valid', info: res.data, message: '' })
      })
      .catch((e) => {
        if (cancelled) return
        setResult({ status: 'invalid', info: null, message: e?.message || 'This invite link is not valid.' })
      })
    return () => {
      cancelled = true
    }
  }, [code])

  const state = code ? result : { status: 'invalid', info: null, message: 'This invite link is incomplete.' }
  const info = state.info
  const referrerIsLabour = info?.referrer?.role === USER_ROLES.LABOUR
  const refParam = state.status === 'valid' ? `?ref=${encodeURIComponent(code)}` : ''
  const usersLink = `/users/auth${refParam}`
  const laboursLink = `/labours/auth${refParam}`

  const rewardLine =
    info?.refereeReward > 0
      ? info.rewardTrigger === 'SIGNUP'
        ? `Sign up with this code and get ₹${info.refereeReward} in your wallet instantly.`
        : `Sign up with this code and get ₹${info.refereeReward} in your wallet after your first completed booking or job.`
      : 'Sign up with this code to join KaamExpert.'

  return (
    <div className="min-h-dvh bg-white selection:bg-brand/20">
      <div className="relative flex flex-col items-center bg-linear-to-b from-brand to-brand-bright pb-12 pt-10 text-white">
        <img src={logoUrl} alt="KaamExpert" className="h-24 w-auto object-contain drop-shadow-sm" />
        <div className="absolute -bottom-1 left-0 right-0 overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 320" className="relative left-[-10%] block h-[50px] w-[120%]" preserveAspectRatio="none">
            <path fill="#ffffff" d="M0,160L48,138.7C96,117,192,75,288,69.3C384,64,480,96,576,128C672,160,768,192,864,186.7C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L0,320Z" />
          </svg>
        </div>
      </div>

      <motion.main
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg px-6 pb-10"
      >
        {state.status === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <p className="text-sm font-medium">Checking your invite…</p>
          </div>
        ) : null}

        {state.status !== 'loading' && realUser ? (
          <div className="py-8 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">You’re already signed in</h1>
            <p className="mt-2 text-sm text-slate-500">Referral codes apply to new accounts only.</p>
            <Link
              to={getRoleHomePath(realUser.role)}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20"
            >
              Go to app
            </Link>
          </div>
        ) : null}

        {state.status === 'valid' && !realUser ? (
          <>
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <Gift className="h-7 w-7" aria-hidden />
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-800">
                {info.referrer.name} invited you
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{rewardLine}</p>
              <div className="mx-auto mt-5 inline-flex flex-col items-center rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 px-6 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Referral code</span>
                <span className="mt-0.5 font-mono text-xl font-extrabold tracking-[0.2em] text-brand">{code}</span>
              </div>
            </div>

            <p className="mb-2 mt-8 text-[11px] font-bold uppercase tracking-wide text-slate-500">Join as</p>
            <div className={`flex gap-3 ${referrerIsLabour ? 'flex-col-reverse' : 'flex-col'}`}>
              <JoinCard
                to={usersLink}
                icon={Home}
                title="Customer / Contractor"
                desc="Hire verified labour for your home, site or project"
                highlighted={!referrerIsLabour}
              />
              <JoinCard
                to={laboursLink}
                icon={HardHat}
                title="Labour / Worker"
                desc="Get matched to paid jobs near you"
                highlighted={referrerIsLabour}
              />
            </div>
          </>
        ) : null}

        {state.status === 'invalid' && !realUser ? (
          <>
            <div className="py-6 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Invite not valid</h1>
              <p className="mt-2 text-sm text-slate-500">{state.message} You can still create an account.</p>
            </div>
            <div className="flex flex-col gap-3">
              <JoinCard to={usersLink} icon={Home} title="Customer / Contractor" desc="Hire verified labour" />
              <JoinCard to={laboursLink} icon={HardHat} title="Labour / Worker" desc="Find jobs near you" />
            </div>
          </>
        ) : null}
      </motion.main>
    </div>
  )
}
