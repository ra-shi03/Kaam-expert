import { getFirebaseAdmin } from '../config/firebase.js';
import { User } from '../models/User.js';

export async function sendNotificationToUser(userId, payload, includeMobile = true) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Collect tokens
    let tokens = [];
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      tokens = [...tokens, ...user.fcmTokens];
    }
    if (includeMobile && user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
      tokens = [...tokens, ...user.fcmTokenMobile];
    }

    // Remove duplicates
    const uniqueTokens = [...new Set(tokens)];

    if (uniqueTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    const isBroadcast = payload.data?.type === 'booking_received'
    // FCM data values must be strings
    const data = Object.fromEntries(Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)]))
    if (isBroadcast && !data.url) data.url = '/app'

    // Prepare message
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
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
        headers: { 'apns-priority': '10', ...(isBroadcast ? { 'apns-expiration': String(Math.floor(Date.now() / 1000) + 300) } : {}) },
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
          tag: String(payload.data?.bookingId || payload.data?.type || 'kaamexpert'),
        },
      },
      tokens: uniqueTokens,
    };

    if (payload.icon) {
      message.notification.imageUrl = payload.icon;
    }

    // Send notification
    const admin = getFirebaseAdmin();
    if (!admin || !admin.messaging) {
      throw new Error('Firebase Admin not configured properly');
    }

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent: ${response.successCount} messages to user ${userId}`);
    if (response.failureCount > 0) {
      console.log(`Failed: ${response.failureCount} messages to user ${userId}`);
      // Optional: Remove invalid tokens based on response.responses
    }

    return response;
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    // Don't throw - notifications are usually non-critical side effects
  }
}
