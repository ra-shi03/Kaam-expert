import { app, messaging } from '../config/firebase.js';
import { getToken, onMessage } from 'firebase/messaging';
import { apiRequest } from '../api/http.js';
import { store } from '../store/index.js';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  }
  return false;
}

// Register service worker explicitly (optional but recommended in SOP)
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Workers are not supported');
  }
}

// Get FCM token
export async function getFCMToken() {
  if (!messaging) {
    console.error('Firebase messaging is not initialized');
    return null;
  }
  try {
    const registration = await registerServiceWorker();
    
    // update() is optional, but ensures we have the latest SW
    try {
      await registration.update();
    } catch (e) {
      console.warn('SW update failed', e);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY, // Uses VAPID_KEY if provided in env, otherwise works without it in some setups
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained:', token);
      return token;
    } else {
      console.log('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
}

// Register FCM token with backend
export async function registerFCMToken(forceUpdate = false) {
  try {
    // Check if user is logged in
    const state = store.getState();
    if (!state.auth.token) {
      console.log('User not authenticated, skipping FCM registration');
      return null;
    }

    // Check if already registered
    const savedToken = localStorage.getItem('fcm_token_web');
    if (savedToken && !forceUpdate) {
      console.log('FCM token already registered locally');
      return savedToken;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    const token = await getFCMToken();
    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    // Save to backend
    const response = await apiRequest('/fcm-tokens/save', {
      method: 'POST',
      body: { token, platform: 'web' }
    });

    if (response.success) {
      localStorage.setItem('fcm_token_web', token);
      console.log('FCM token registered with backend');
      return token;
    } else {
      throw new Error('Failed to register token with backend');
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
    // We don't want to break the app if push notifications fail
    return null;
  }
}

// Setup foreground notification handler
export function setupForegroundNotificationHandler(handler) {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Optional: Show browser notification if we are in the foreground
    // but typically we let the custom handler (like a toast or alert) deal with it
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || '/favicon.png',
        data: payload.data
      });
    }

    if (handler) {
      handler(payload);
    }
  });
}

// Initialize push notifications (call this on app load)
export async function initializePushNotifications() {
  try {
    await registerServiceWorker();
    // The actual token generation and registration will happen on login
    // or when the user explicitly requests it.
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}
