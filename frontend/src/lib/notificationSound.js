/**
 * In-app notification chime. The OS plays its default sound for background pushes;
 * this covers the app being open, where browsers show notifications silently.
 * Generated with Web Audio, so there is no audio file to ship.
 */

const PREF_KEY = 'kaam_notification_sound'
const MIN_GAP_MS = 1200

let ctx = null
let lastPlayedAt = 0

function getContext() {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

export function isNotificationSoundEnabled() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setNotificationSoundEnabled(enabled) {
  try {
    localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off')
  } catch {
    /* storage unavailable */
  }
}

/** Browsers only allow audio after a user gesture; resume the context on the first one. */
export function installNotificationSoundUnlock() {
  if (typeof window === 'undefined') return
  const unlock = () => {
    const c = getContext()
    if (c?.state === 'suspended') c.resume().catch(() => {})
    if (c?.state === 'running') {
      ;['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, unlock))
    }
  }
  ;['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { passive: true }))
}

function tone(c, freq, start, duration, volume) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Two-note "ding-dong". `urgent` (new job offers) is louder and adds a third note. */
export function playNotificationSound({ urgent = false } = {}) {
  if (!isNotificationSoundEnabled()) return
  const now = Date.now()
  if (now - lastPlayedAt < MIN_GAP_MS) return
  lastPlayedAt = now

  try {
    navigator.vibrate?.(urgent ? [250, 120, 250, 120, 250] : [200, 100, 200])
  } catch {
    /* vibration unsupported */
  }

  const c = getContext()
  if (!c) return
  const play = () => {
    const t = c.currentTime + 0.02
    const vol = urgent ? 0.5 : 0.35
    tone(c, 880, t, 0.28, vol)
    tone(c, 659.25, t + 0.18, 0.38, vol)
    if (urgent) tone(c, 880, t + 0.4, 0.45, vol)
  }
  if (c.state === 'suspended') c.resume().then(play).catch(() => {})
  else play()
}
