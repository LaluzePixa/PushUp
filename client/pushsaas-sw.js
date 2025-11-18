// Versión del Service Worker
const SW_VERSION = '1.0.1';
console.log(`[SW] PushSaaS Service Worker ${SW_VERSION} loaded`);

// Evento de instalación - forzar activación inmediata
self.addEventListener('install', event => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  event.waitUntil(self.skipWaiting());
});

// Evento de activación - tomar control inmediatamente
self.addEventListener('activate', event => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  event.waitUntil(self.clients.claim());
});

// Estrategia Network First - siempre obtener la última versión
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      console.log('[SW] Offline, no hay caché disponible');
      return new Response('Sin conexión', { status: 503 });
    })
  );
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || 'Notificación';
  const options = {
    body: payload.body || '',
    icon: '/favicon.ico',
    data: { url: payload.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(winClients => {
    for (const client of winClients) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
