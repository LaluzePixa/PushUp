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
  