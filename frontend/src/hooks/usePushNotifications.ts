'use client';

import { useState, useEffect } from 'react';
import { pushService, PushSubscription } from '@/services/api';

interface UsePushNotificationsReturn {
    isSupported: boolean;
    isSubscribed: boolean;
    loading: boolean;
    error: string | null;
    subscribe: (siteId?: number) => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    requestPermission: () => Promise<boolean>;
    permission: NotificationPermission;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Verificar soporte para notificaciones push
        const checkSupport = () => {
            const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);
                checkSubscriptionStatus();
            }
        };

        checkSupport();
    }, []);

    /**
     * Verificar si el usuario ya está suscrito
     */
    const checkSubscriptionStatus = async () => {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    };

    /**
     * Solicitar permisos para notificaciones
     */
    const requestPermission = async (): Promise<boolean> => {
        if (!isSupported) {
            setError('Las notificaciones push no están soportadas en este navegador');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                setError(null);
                return true;
            } else {
                setError('Permisos de notificación denegados');
                return false;
            }
        } catch (error) {
            setError('Error al solicitar permisos de notificación');
            console.error('Permission request error:', error);
            return false;
        }
    };

    /**
     * Registrar Service Worker y esperar a que esté activo
     */
    const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/pushsaas-sw.js', {
                    scope: '/',
                });

                console.log('Service Worker registrado exitosamente:', registration);

                // Esperar a que el Service Worker esté activo
                if (registration.installing) {
                    console.log('[SW] Service Worker está instalándose, esperando...');
                    await new Promise<void>((resolve) => {
                        registration.installing!.addEventListener('statechange', function () {
                            if (this.state === 'activated') {
                                console.log('[SW] Service Worker activado!');
                                resolve();
                            }
                        });
                    });
                } else if (registration.waiting) {
                    console.log('[SW] Service Worker está esperando, activando...');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    await new Promise<void>((resolve) => {
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                            console.log('[SW] Controller changed, Service Worker activo!');
                            resolve();
                        });
                    });
                } else if (registration.active) {
                    console.log('[SW] Service Worker ya está activo');
                }

                // Asegurar que el Service Worker está listo
                await navigator.serviceWorker.ready;
                console.log('[SW] Service Worker completamente listo');

                return registration;
            }
            return null;
        } catch (error) {
            console.error('Error registrando Service Worker:', error);
            setError('Error al registrar Service Worker');
            return null;
        }
    };

    /**
     * Suscribirse a notificaciones push
     */
    const subscribe = async (siteId?: number): Promise<boolean> => {
        if (!isSupported) {
            setError('Las notificaciones push no están soportadas');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // Solicitar permisos si no están concedidos
            if (permission !== 'granted') {
                const permissionGranted = await requestPermission();
                if (!permissionGranted) {
                    return false;
                }
            }

            // Registrar Service Worker
            const registration = await registerServiceWorker();
            if (!registration) {
                setError('Error al registrar Service Worker');
                return false;
            }

            // Obtener clave pública VAPID del backend
            console.log('[usePushNotifications] Obteniendo clave VAPID...');
            let vapidPublicKey: string;

            try {
                const vapidResponse = await pushService.getVapidPublicKey();
                console.log('[usePushNotifications] Respuesta VAPID:', vapidResponse);

                if (!vapidResponse.data?.publicKey) {
                    console.error('[usePushNotifications] Error: No hay publicKey en la respuesta:', vapidResponse);
                    setError('Error al obtener clave VAPID del servidor');
                    return false;
                }

                vapidPublicKey = vapidResponse.data.publicKey;
                console.log('[usePushNotifications] Clave VAPID obtenida:', vapidPublicKey);
            } catch (vapidError: unknown) {
                console.error('[usePushNotifications] Error al obtener VAPID:', vapidError);
                const errorMessage = vapidError instanceof Error ? vapidError.message : 'Error desconocido';
                setError(`Error al obtener clave VAPID del servidor: ${errorMessage}`);
                return false;
            }

            // Crear suscripción push
            console.log('[usePushNotifications] Creando suscripción push...');

            // Validar formato de la clave VAPID
            if (!vapidPublicKey || vapidPublicKey.length < 80) {
                console.error('[usePushNotifications] Clave VAPID inválida - longitud:', vapidPublicKey?.length);
                setError('Clave VAPID inválida del servidor');
                return false;
            }

            const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
            console.log('[usePushNotifications] Clave convertida exitosamente, longitud:', convertedKey.length);

            // Verificar que el PushManager esté disponible
            if (!registration.pushManager) {
                console.error('[usePushNotifications] PushManager no disponible');
                setError('PushManager no está disponible en este navegador');
                return false;
            }

            // Crear suscripción push con más logging
            console.log('[usePushNotifications] Llamando a pushManager.subscribe...');
            const pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey as BufferSource,
            });
            console.log('[usePushNotifications] Suscripción push creada exitosamente:', pushSubscription);

            // Preparar datos de suscripción para el backend
            console.log('[usePushNotifications] Preparando datos para el backend...');
            const subscriptionData: PushSubscription = {
                endpoint: pushSubscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
                    auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
                },
                siteId,
            };
            console.log('[usePushNotifications] Datos preparados:', subscriptionData);

            // Enviar suscripción al backend
            console.log('[usePushNotifications] Enviando suscripción al backend...');
            const response = await pushService.subscribe(subscriptionData);
            console.log('[usePushNotifications] Respuesta del backend:', response);

            if (response.data?.id) {
                setIsSubscribed(true);
                console.log('Suscripción exitosa:', response.data.id);
                return true;
            } else {
                setError('Error al guardar suscripción en el servidor');
                return false;
            }

        } catch (error: unknown) {
            console.error('Error en suscripción:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al suscribirse a notificaciones';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cancelar suscripción a notificaciones
     */
    const unsubscribe = async (): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    await subscription.unsubscribe();
                    setIsSubscribed(false);
                    console.log('Suscripción cancelada exitosamente');
                    return true;
                }
            }

            return false;
        } catch (error: unknown) {
            console.error('Error al cancelar suscripción:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cancelar suscripción';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        isSupported,
        isSubscribed,
        loading,
        error,
        subscribe,
        unsubscribe,
        requestPermission,
        permission,
    };
};

/**
 * Convierte una cadena base64 URL-safe a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Convierte ArrayBuffer a string base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}