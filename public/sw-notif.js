// Service Worker for background notifications
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Listen for push messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, url } = event.data;
    self.registration.showNotification(title, {
      body: body || '',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'notif-' + Date.now(),
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: { url: url || '/' },
    });
  }
});

// Handle notification click — focus or open the dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
