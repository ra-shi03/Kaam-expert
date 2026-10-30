importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDRxk3hpYDa53V8gVaFd568A3Z5UeslDaE",
  authDomain: "kaamexpert.firebaseapp.com",
  projectId: "kaamexpert",
  storageBucket: "kaamexpert.firebasestorage.app",
  messagingSenderId: "669163351420",
  appId: "1:669163351420:web:7c0240103ce80aa034c8f9",
  measurementId: "G-LVC8GXB1JM"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload?.notification?.title || 'Notification';
  const data = payload?.data || {};
  const notificationOptions = {
    body: payload?.notification?.body || '',
    icon: '/favicon.ico',
    data,
    // Same tag as the server-sent one, so the alert is replaced instead of shown twice
    tag: String(data.bookingId || data.type || 'kaamexpert'),
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: data.type === 'booking_received',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
