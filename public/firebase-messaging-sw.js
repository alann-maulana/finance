// KasKu — Firebase Messaging Service Worker
// Handles push notifications when the app is in the background or closed.
// This file must be served from the root scope (/).

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// Firebase config is embedded at build time via next.config.ts meta injection,
// but for SW we read from a self.__firebaseConfig injected by the page (see AppContext).
// Fallback: read from self.__FIREBASE_CONFIG set by the page via a dedicated script tag.
// If neither is available, SW will not initialise messaging (graceful fallback).

// ── Wait for config to be provided via postMessage ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      // Firebase sends: { notification: { title, body }, data: {}, fcmOptions: { link } }
      // Normalize to handle both message shapes gracefully.
      const notification = payload.notification || {};
      const title = notification.title || payload.title || 'KasKu';
      const body  = notification.body  || payload.body  || '';
      const url   = payload.fcmOptions?.link
                 || payload.data?.url
                 || notification.click_action
                 || '/dashboard';

      self.registration.showNotification(title, {
        body,
        icon: notification.icon || '/icons/icon-192x192.png',
        // Monochrome badge for Android status bar (white + transparent PNG)
        badge: '/icons/badge-monochrome.png',
        vibrate: [100, 50, 100],
        data: { url },
      });
    });
  }
});

// ── Notification click: open/focus the target URL ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing open window at the target URL if possible
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
