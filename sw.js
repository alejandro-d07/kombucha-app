const CACHE_NAME = 'kombuchan-v3';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Kombuchan', body: 'Tienes alertas pendientes' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_CHECKS') {
    const readyAlerts = (e.data.alerts || []).filter(a => a.type === 'ready' || a.type === 'warn');
    if (readyAlerts.length > 0) {
      self.registration.showNotification('Kombuchan — ' + readyAlerts.length + ' alerta(s) activa(s)', {
        body: readyAlerts.map(a => a.title).join('\n'),
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'kombuchan-alerts',
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
