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

    // Prepare message
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
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
