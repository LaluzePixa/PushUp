/**
 * Worker Thread para envío de notificaciones push
 * 
 * Este worker procesa batches de suscripciones y envía notificaciones
 * en paralelo usando web-push. Está diseñado para ejecutarse en un
 * pool de workers para aprovechar múltiples cores del CPU.
 * 
 * @module workers/notification-sender
 */

import { parentPort, workerData } from 'worker_threads';
import webpush from 'web-push';

/**
 * Procesa un batch de suscripciones enviando notificaciones
 * 
 * @param {Object} data - Datos del trabajo
 * @param {Array} data.subscriptions - Array de suscripciones
 * @param {Object} data.payload - Payload de la notificación
 * @param {Object} data.vapidKeys - Claves VAPID para autenticación
 * @param {string} data.campaignId - ID de la campaña
 * @returns {Object} Resultados del envío
 */
async function processBatch({ subscriptions, payload, vapidKeys, campaignId }) {
    // Configurar web-push con las claves VAPID
    webpush.setVapidDetails(
        'mailto:support@pushsaas.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    const results = {
        sent: [],
        failed: [],
        expired: []
    };

    // Procesar todas las suscripciones en paralelo
    const promises = subscriptions.map(async (subscription) => {
        try {
            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth
                }
            };

            await webpush.sendNotification(
                pushSubscription,
                JSON.stringify(payload)
            );

            results.sent.push({
                status: 'sent',
                campaignId,
                subscriptionId: subscription.id,
                endpoint: subscription.endpoint
            });

        } catch (error) {
            const isExpired = error.statusCode === 410 || error.statusCode === 404;

            const failureData = {
                status: isExpired ? 'expired' : 'failed',
                campaignId,
                subscriptionId: subscription.id,
                endpoint: subscription.endpoint,
                error: error.message,
                statusCode: error.statusCode
            };

            if (isExpired) {
                results.expired.push(failureData);
            } else {
                results.failed.push(failureData);
            }
        }
    });

    await Promise.allSettled(promises);

    return {
        totalSent: results.sent.length,
        totalFailed: results.failed.length,
        totalExpired: results.expired.length,
        executions: [...results.sent, ...results.failed, ...results.expired]
    };
}

// Escuchar mensajes del thread principal
if (parentPort) {
    parentPort.on('message', async (data) => {
        try {
            const result = await processBatch(data);
            parentPort.postMessage({ success: true, result });
        } catch (error) {
            parentPort.postMessage({
                success: false,
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
        }
    });

    // Informar que el worker está listo
    parentPort.postMessage({ type: 'ready' });
}
