/**
 * Remembers a referral code from a /r/:code link until signup completes,
 * so it survives the user browsing around or reloading before they register.
 */
const KEY = 'ke_pending_referral_code'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function normalizeReferralCode(raw) {
  return String(raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
}

export function savePendingReferralCode(code) {
  const c = normalizeReferralCode(code)
  if (!c) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: c, savedAt: Date.now() }))
  } catch {
    // storage unavailable (private mode) — the ?ref= query still carries the code
  }
}

export function readPendingReferralCode() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return ''
    const { code, savedAt } = JSON.parse(raw)
    if (!code || Date.now() - Number(savedAt) > MAX_AGE_MS) {
      localStorage.removeItem(KEY)
      return ''
    }
    return normalizeReferralCode(code)
  } catch {
    return ''
  }
}

export function clearPendingReferralCode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Public share link for a code — `/r/:code` opens the referral landing page */
export function buildReferralLink(code) {
  return `${window.location.origin}/r/${encodeURIComponent(code)}`
}
