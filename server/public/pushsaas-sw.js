// PushSaaS Service Worker
const SW_VERSION = '1.0.2';
console.log(`[PushSaaS SW] Version ${SW_VERSION} loaded`);

// Evento de instalación - activar inmediatamente
self.addEventListener('install', event => {
  console.log(`[PushSaaS SW] Installing version ${SW_VERSION}`);
  event.waitUntil(self.skipWaiting());
});

// Evento de activación - tomar control inmediatamente
self.addEventListener('activate', event => {
  console.log(`[PushSaaS SW] Activating version ${SW_VERSION}`);
  event.waitUntil(self.clients.claim());
});

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('[PushSaaS SW] Push event recibido:', event);

  if (!event.data) {
    console.log('[PushSaaS SW] No hay datos en el push event');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('[PushSaaS SW] Payload:', payload);

    const title = payload.title || 'Notificación';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || 'pushsaas-notification',
      data: { url: payload.url || '/' },
      requireInteraction: false,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[PushSaaS SW] Error procesando push:', error);
  }
});

// Manejar clic en notificación
self.addEventListener('notificationclick', event => {
  console.log('[PushSaaS SW] Notificación clickeada:', event.notification);

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(winClients => {
        // Buscar si ya hay una ventana abierta con esa URL
        for (const client of winClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
