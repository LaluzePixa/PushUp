/**
 * PushSaaS Service Worker
 * Maneja las notificaciones push y eventos relacionados
 */

const SW_VERSION = '1.0.0';
const CACHE_NAME = `pushsaas-cache-${SW_VERSION}`;

// URLs que se cachearán (solo las esenciales que existen)
const STATIC_CACHE_URLS = [
    // No cachear nada en desarrollo para evitar errores
    // '/',
    // '/manifest.json',
];

/**
 * Evento de instalación del Service Worker
 */
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing service worker version ${SW_VERSION}`);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                // Solo cachear si hay URLs para cachear
                if (STATIC_CACHE_URLS.length > 0) {
                    return cache.addAll(STATIC_CACHE_URLS);
                }
                return Promise.resolve();
            })
            .then(() => {
                console.log('[SW] Installation complete');
                // Forzar la activación del nuevo service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

/**
 * Evento de activación del Service Worker
 */
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating service worker version ${SW_VERSION}`);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Eliminar cachés antiguos
                const deletePromises = cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => {
                        console.log(`[SW] Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    });

                return Promise.all(deletePromises);
            })
            .then(() => {
                console.log('[SW] Activation complete');
                // Tomar control de todas las páginas inmediatamente
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('[SW] Activation failed:', error);
            })
    );
});

/**
 * Evento de interceptación de fetch (estrategia de caché)
 */
self.addEventListener('fetch', (event) => {
    // Solo interceptar requests GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Estrategia: Network First para API calls, Cache First para assets estáticos
    const isApiCall = event.request.url.includes('/api/') ||
        event.request.url.includes('localhost:3000');

    if (isApiCall) {
        // Network First para API calls
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Si falla la red, intentar respuesta desde caché
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache First para assets estáticos
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    // Si no está en caché, hacer fetch y cachear
                    return fetch(event.request)
                        .then((response) => {
                            // Solo cachear respuestas exitosas
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                            return response;
                        });
                })
                .catch(() => {
                    // Fallback para páginas offline
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                })
        );
    }
});

/**
 * Evento de recepción de notificación push
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    let notificationData = {
        title: 'PushSaaS',
        body: 'Nueva notificación',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        url: '/',
        tag: 'pushsaas-notification',
        requireInteraction: false,
        silent: false,
    };

    // Procesar datos de la notificación si están disponibles
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                url: data.url || notificationData.url,
                tag: data.tag || notificationData.tag,
                requireInteraction: data.requireInteraction || notificationData.requireInteraction,
                silent: data.silent || notificationData.silent,
                data: data, // Datos adicionales para el evento click
            };
        } catch (error) {
            console.error('[SW] Error parsing push notification data:', error);
        }
    }

    const notificationOptions = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        silent: notificationData.silent,
        data: notificationData,
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: '/icon-32x32.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icon-32x32.png'
            }
        ],
        timestamp: Date.now(),
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationOptions)
            .then(() => {
                console.log('[SW] Notification shown successfully');

                // Enviar evento a analytics si está configurado
                if ('clients' in self) {
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'PUSH_NOTIFICATION_RECEIVED',
                                data: notificationData
                            });
                        });
                    });
                }
            })
            .catch((error) => {
                console.error('[SW] Error showing notification:', error);
            })
    );
});

/**
 * Evento de click en notificación
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    // Cerrar la notificación
    notification.close();

    // Manejar acciones específicas
    if (action === 'close') {
        console.log('[SW] Notification closed by user action');
        return;
    }

    // Determinar URL de destino
    let targetUrl = data.url || '/dashboard';

    // Asegurar que sea una URL completa
    if (!targetUrl.startsWith('http')) {
        targetUrl = new URL(targetUrl, self.location.origin).href;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Buscar si ya hay una ventana abierta con la URL objetivo
                const existingClient = clientList.find(client => {
                    const clientUrl = new URL(client.url);
                    const targetUrlObj = new URL(targetUrl);
                    return clientUrl.origin === targetUrlObj.origin;
                });

                if (existingClient) {
                    // Si existe, enfocar esa ventana y navegar a la URL
                    return existingClient.focus().then(client => {
                        if (client.navigate) {
                            return client.navigate(targetUrl);
                        } else {
                            // Fallback: enviar mensaje para que navegue
                            client.postMessage({
                                type: 'NOTIFICATION_CLICK_NAVIGATE',
                                url: targetUrl,
                                data: data
                            });
                        }
                    });
                } else {
                    // Si no existe, abrir nueva ventana
                    return clients.openWindow(targetUrl);
                }
            })
            .then((windowClient) => {
                console.log('[SW] Window opened/focused:', windowClient ? windowClient.url : 'none');

                // Enviar analytics del click
                if (windowClient) {
                    windowClient.postMessage({
                        type: 'PUSH_NOTIFICATION_CLICKED',
                        data: data,
                        action: action
                    });
                }
            })
            .catch((error) => {
                console.error('[SW] Error handling notification click:', error);
            })
    );
});

/**
 * Evento de cierre de notificación
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event.notification);

    const data = event.notification.data || {};

    // Enviar evento a analytics
    if ('clients' in self) {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'PUSH_NOTIFICATION_CLOSED',
                    data: data
                });
            });
        });
    }
});

/**
 * Evento de sincronización en segundo plano
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'pushsaas-sync') {
        event.waitUntil(
            doBackgroundSync()
                .catch((error) => {
                    console.error('[SW] Background sync failed:', error);
                })
        );
    }
});

/**
 * Función para sincronización en segundo plano
 */
async function doBackgroundSync() {
    console.log('[SW] Performing background sync...');

    try {
        // Aquí puedes implementar lógica de sincronización
        // Por ejemplo: enviar datos pendientes, actualizar caché, etc.

        // Ejemplo: limpiar notificaciones antiguas
        const notifications = await self.registration.getNotifications();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas

        notifications.forEach(notification => {
            if (notification.timestamp && (now - notification.timestamp) > maxAge) {
                notification.close();
            }
        });

        console.log('[SW] Background sync completed');
    } catch (error) {
        console.error('[SW] Background sync error:', error);
        throw error;
    }
}

/**
 * Manejo de mensajes del cliente
 */
self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Saltando espera y activando...');
        self.skipWaiting();
    }
});

/**
 * Manejo de errores del Service Worker
 */
self.addEventListener('error', (event) => {
    console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log(`[SW] PushSaaS Service Worker ${SW_VERSION} loaded`);