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
  const notificationOptions = {
    body: payload?.notification?.body || '',
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
