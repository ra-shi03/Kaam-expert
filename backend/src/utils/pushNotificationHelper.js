import { getFirebaseAdmin } from '../config/firebase.js'
import { User } from '../models/User.js'
import { Notification } from '../models/Notification.js'
import { emitToUser } from '../socket.js'

/** Firebase error codes that mean the device token is dead and should be forgotten. */
// NOTE: 'messaging/invalid-argument' is deliberately NOT here — it can describe a bad payload, and
// treating it as a dead token would wipe every device the first time the message shape is wrong.
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
])

// Allows tests / alternative transports to replace the Firebase messaging client
let messagingOverride = null
export function setMessagingClient(client) {
  messagingOverride = client
}
function getMessagingClient() {
  if (messagingOverride) return messagingOverride
  const admin = getFirebaseAdmin()
  if (!admin || !admin.messaging) return null
  return admin.messaging()
}

/** Removes tokens Firebase reported as dead so they are not retried on every send. */
async function pruneDeadTokens(userId, tokens, responses) {
  const dead = []
  responses.forEach((r, i) => {
    if (!r.success && DEAD_TOKEN_CODES.has(r.error?.code)) dead.push(tokens[i])
  })
  if (dead.length === 0) return 0
  await User.updateOne({ _id: userId }, { $pull: { fcmTokens: { $in: dead }, fcmTokenMobile: { $in: dead }, fcmDevices: { token: { $in: dead } } } })
  return dead.length
}

/**
 * Single entry point for every user notification:
 *   1. saves it to the in-app inbox (unless `persist: false`)
 *   2. sends it live over the socket (NOTIFICATION_NEW) so open apps update instantly
 *   3. sends the Firebase push to every registered device
 * Never throws — notifications are a side effect and must not break the caller.
 *
 * payload: { title, body, data?: { type, url, bookingId, ... }, icon?, persist? }
 */
export async function sendNotificationToUser(userId, payload, includeMobile = true) {
  try {
    const type = String(payload.data?.type || 'general')
    const url = payload.data?.url || '/app'
    // FCM data values must be strings
    const data = Object.fromEntries(
      Object.entries({ ...(payload.data || {}), type, url }).map(([k, v]) => [k, String(v)]),
    )

    // 1 + 2: inbox + live socket event
    if (payload.persist !== false && type !== 'test') {
      try {
        const doc = await Notification.create({
          userId,
          type,
          title: payload.title,
          body: payload.body || '',
          url,
          data: payload.data || {},
        })
        data.notificationId = String(doc._id)
        try {
          emitToUser(userId, 'NOTIFICATION_NEW', {
            _id: doc._id,
            type,
            title: doc.title,
            body: doc.body,
            url,
            data: doc.data,
            createdAt: doc.createdAt,
            readAt: null,
          })
        } catch {
          /* socket server not running (e.g. scripts) */
        }
      } catch (err) {
        console.warn('[NOTIFY] could not save inbox entry:', err.message || err)
      }
    }

    // 3: Firebase push
    const user = await User.findById(userId).select('fcmTokens fcmTokenMobile')
    if (!user) return

    let tokens = [...(user.fcmTokens || [])]
    if (includeMobile) tokens = [...tokens, ...(user.fcmTokenMobile || [])]
    const uniqueTokens = [...new Set(tokens.filter(Boolean))]
    if (uniqueTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`)
      return
    }

    const isBroadcast = type === 'booking_received'
    const message = {
      notification: { title: payload.title, body: payload.body },
      data,
      // Ring with the phone's default notification sound (and vibrate) even when the app is in the background
      android: {
        priority: 'high',
        // A job offer is worthless once the broadcast window (5 min) closes
        ...(isBroadcast ? { ttl: 300000 } : {}),
        notification: {
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          channelId: 'kaamexpert_default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
          ...(isBroadcast ? { 'apns-expiration': String(Math.floor(Date.now() / 1000) + 300) } : {}),
        },
        payload: { aps: { sound: 'default' } },
      },
      webpush: {
        headers: { Urgency: 'high', ...(isBroadcast ? { TTL: '300' } : {}) },
        notification: {
          icon: '/icon-192.png',
          badge: '/favicon.png',
          vibrate: isBroadcast ? [250, 120, 250, 120, 250] : [200, 100, 200],
          requireInteraction: isBroadcast,
          renotify: true,
          // Same tag per booking: a newer notification replaces the older one instead of stacking
          tag: String(payload.data?.bookingId || type || 'kaamexpert'),
        },
        fcmOptions: { link: url },
      },
      tokens: uniqueTokens,
    }
    if (payload.icon) message.notification.imageUrl = payload.icon

    const messaging = getMessagingClient()
    if (!messaging) throw new Error('Firebase Admin not configured properly')

    const response = await messaging.sendEachForMulticast(message)
    // Per-device outcome (used by the test endpoint to show exactly which device failed and why)
    response.results = (response.responses || []).map((r, i) => ({ token: uniqueTokens[i], ok: !!r.success, error: r.error?.code || null }))
    console.log(`Successfully sent: ${response.successCount} messages to user ${userId} (${type})`)
    if (response.failureCount > 0) {
      const removed = await pruneDeadTokens(userId, uniqueTokens, response.responses || [])
      console.log(`Failed: ${response.failureCount} messages to user ${userId}; removed ${removed} dead token(s)`)
    }
    return response
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error.message || error)
    // Don't throw - notifications are usually non-critical side effects
  }
}
