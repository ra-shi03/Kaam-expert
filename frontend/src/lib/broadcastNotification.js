/**
 * System notification for a new job broadcast, raised by the app itself the moment the offer arrives.
 * It does not depend on the Firebase push reaching this browser. It uses the same tag as the server push,
 * so when both arrive they replace each other instead of showing twice.
 */

function tagFor(offer) {
  return String(offer?.bookingId || 'kaamexpert')
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'))
      || (await navigator.serviceWorker.register('/firebase-messaging-sw.js'))
  } catch {
    return null
  }
}

export async function showBroadcastNotification(offer) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false

  const service = offer?.serviceName || offer?.services?.[0]?.name || 'New'
  const earnings = offer?.estimatedEarnings ?? offer?.laborShare
  const options = {
    body: `${service} job near you${earnings != null ? ` · Earn ₹${earnings}` : ''}. Tap to accept.`,
    icon: '/favicon.ico',
    tag: tagFor(offer),
    renotify: true,
    requireInteraction: true,
    vibrate: [250, 120, 250, 120, 250],
    data: { type: 'booking_received', bookingId: String(offer?.bookingId || ''), url: '/app' },
  }

  try {
    // The service-worker route works everywhere (Android Chrome rejects `new Notification`)
    const reg = await getRegistration()
    if (reg) {
      await reg.showNotification('New Job Offer!', options)
      return true
    }
    const n = new Notification('New Job Offer!', options)
    n.onclick = () => {
      window.focus()
      n.close()
    }
    return true
  } catch (err) {
    console.warn('Could not show broadcast notification', err)
    return false
  }
}

export async function clearBroadcastNotification(bookingId) {
  try {
    const reg = await getRegistration()
    const list = (await reg?.getNotifications({ tag: String(bookingId) })) || []
    list.forEach((n) => n.close())
  } catch {
    /* nothing to clear */
  }
}
