import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, Gift, Loader2, MessageCircle, Share2, UserPlus, Users, Wallet } from 'lucide-react'
import { referralsApi } from '../../api/referralsApi.js'
import { ApiError } from '../../api/http.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useReferralProgram } from '../../hooks/useReferralProgram.js'
import { ROLE_LABELS, USER_ROLES } from '../../constants/userRoles.js'
import { buildReferralLink } from '../../lib/referralStorage.js'
import { AppStackScreenHeader } from '../../components/app/AppStackScreenHeader.jsx'
import { AppSectionHeader } from '../../components/app-ui/layout/AppSectionHeader.jsx'
import { AppBadge } from '../../components/app-ui/data-display/AppBadge.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'

const STATUS_BADGE = {
  PENDING: { label: 'Pending', variant: 'amber' },
  REWARDED: { label: 'Rewarded', variant: 'emerald' },
  REJECTED: { label: 'Not eligible', variant: 'rose' },
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older WebViews without the async clipboard API
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

function CopyRow({ label, value, mono }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50 py-1.5 pl-4 pr-1.5">
        <span className={`min-w-0 flex-1 truncate text-sm font-bold text-slate-900 ${mono ? 'font-mono tracking-[0.18em]' : ''}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={async () => {
            if (await copyText(value)) {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-brand shadow-sm ring-1 ring-slate-200/80 transition active:scale-95"
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center ring-1 ring-slate-200/80">
      <p className="text-lg font-extrabold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

export function AppReferralPage() {
  const { user } = useAuth()
  const referralProgram = useReferralProgram()
  const reduce = useReducedMotion()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hidden, setHidden] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    referralsApi
      .getMyReferrals()
      .then((res) => {
        if (cancelled) return
        setData(res.data)
        setError('')
      })
      .catch((e) => {
        if (cancelled) return
        if (e instanceof ApiError && e.code === 'REFERRAL_HIDDEN') setHidden(true)
        else setError(e instanceof ApiError ? e.message : 'Could not load your referrals')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  const program = data?.program
  const link = data?.code ? buildReferralLink(data.code) : ''
  const afterJob = program?.rewardTrigger !== 'SIGNUP'
  const shareMessage = data?.code
    ? `Join me on KaamExpert! Use my code ${data.code} to sign up${
        program?.refereeReward > 0 ? ` and get ₹${program.refereeReward}` : ''
      }: ${link}`
    : ''
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const withdrawable = user?.role === USER_ROLES.LABOUR || user?.role === USER_ROLES.CONTRACTOR

  async function handleNativeShare() {
    try {
      await navigator.share({ title: 'Join KaamExpert', text: shareMessage, url: link })
    } catch {
      // user dismissed the share sheet
    }
  }

  if ((referralProgram.loaded && !referralProgram.showInApp) || hidden) {
    return <Navigate to="/app/profile" replace />
  }

  return (
    <motion.div
      className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden bg-linear-to-b from-slate-50/95 via-white to-blue-50/15 pb-28 pt-1"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AppStackScreenHeader title="Refer & earn" backTo="/app/profile" />

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <p className="text-sm font-medium">Loading your referral link…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <GlassPanel className="p-5 text-center">
          <p className="text-sm font-medium text-rose-900">{error}</p>
          <button type="button" onClick={retry} className="mt-3 text-sm font-bold text-brand">
            Try again
          </button>
        </GlassPanel>
      ) : null}

      {!loading && data ? (
        <>
          <GlassPanel className="overflow-hidden p-0">
            <div className="bg-linear-to-br from-brand to-brand-bright px-5 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                  <Gift className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold leading-tight">
                    {program.referrerReward > 0 ? `Earn ₹${program.referrerReward} per friend` : 'Invite your friends'}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-white/85">
                    {program.refereeReward > 0 ? `They get ₹${program.refereeReward} too` : 'Grow the KaamExpert community'}
                    {afterJob ? ' — after their first completed booking or job' : ' — as soon as they sign up'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {!program.isEnabled ? (
                <p className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-950">
                  The referral program is paused right now. New signups won’t earn rewards until it’s back on.
                </p>
              ) : null}
              <CopyRow label="Your referral code" value={data.code} mono />
              <CopyRow label="Your invite link" value={link} />
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp
                </a>
                {canNativeShare ? (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                    Share
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => copyText(shareMessage)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    Copy message
                  </button>
                )}
              </div>
            </div>
          </GlassPanel>

          <div className="grid grid-cols-4 gap-2">
            <StatTile label="Invited" value={data.stats.total} />
            <StatTile label="Pending" value={data.stats.pending} />
            <StatTile label="Rewarded" value={data.stats.rewarded} />
            <StatTile label="Earned" value={`₹${data.stats.totalEarned}`} />
          </div>

          <section>
            <AppSectionHeader title="How it works" className="mb-3 px-0.5" />
            <GlassPanel className="space-y-3 p-4">
              {[
                { icon: Share2, text: 'Share your link or code with friends, customers or fellow workers.' },
                {
                  icon: UserPlus,
                  text: afterJob
                    ? 'They sign up with your code and complete their first booking or job.'
                    : 'They sign up on KaamExpert using your code.',
                },
                {
                  icon: Wallet,
                  text: withdrawable
                    ? 'You both get rewards in your wallet — withdraw them with your earnings.'
                    : 'You both get rewards credited to your KaamExpert wallet.',
                },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                    <s.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="pt-1.5 text-sm font-medium text-slate-700">{s.text}</p>
                </div>
              ))}
            </GlassPanel>
          </section>

          {data.joinedWith ? (
            <GlassPanel className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">You joined with</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{data.joinedWith.referrerName}’s code</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <AppBadge variant={STATUS_BADGE[data.joinedWith.status]?.variant}>
                  {STATUS_BADGE[data.joinedWith.status]?.label}
                </AppBadge>
                {data.joinedWith.reward > 0 ? (
                  <span className="text-xs font-bold text-slate-700">+₹{data.joinedWith.reward}</span>
                ) : null}
              </div>
            </GlassPanel>
          ) : null}

          <section>
            <AppSectionHeader title="Your invites" className="mb-3 px-0.5" />
            {data.referrals.length === 0 ? (
              <GlassPanel className="flex flex-col items-center gap-2 p-8 text-center">
                <Users className="h-9 w-9 text-slate-300" aria-hidden />
                <p className="text-sm font-semibold text-slate-700">No one has joined with your code yet</p>
                <p className="text-xs text-slate-500">Share your link to get started.</p>
              </GlassPanel>
            ) : (
              <ul className="space-y-2">
                {data.referrals.map((r) => (
                  <li key={r._id}>
                    <GlassPanel className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{r.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {ROLE_LABELS[r.role] || 'User'} · Joined {formatDate(r.joinedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <AppBadge variant={STATUS_BADGE[r.status]?.variant}>{STATUS_BADGE[r.status]?.label}</AppBadge>
                        {r.reward > 0 ? <span className="text-xs font-bold text-slate-700">+₹{r.reward}</span> : null}
                      </div>
                    </GlassPanel>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </motion.div>
  )
}
