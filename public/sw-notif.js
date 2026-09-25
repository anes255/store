self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'New Notification', body: '', url: '/dashboard/orders' };
  try { data = event.data.json(); } catch (e) { data.body = event.data?.text() || ''; }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: 'order-' + Date.now(),
      requireInteraction: true,
      data: { url: data.url || '/dashboard/orders' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Prefer a tab already on the target page (store dashboard vs super
      // admin share this worker), otherwise open the page the push points to.
      const target = new URL(url, self.location.origin).pathname;
      for (const client of clients) {
        if (new URL(client.url).pathname.startsWith(target) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
