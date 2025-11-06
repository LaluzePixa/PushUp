/**
 * Mock del notification sender para tests
 * Versión sincrónica que no usa worker threads
 */

import webpush from 'web-push';

/**
 * Procesa un batch de suscripciones (versión mock)
 */
export async function processBatchSync({ subscriptions, payload, vapidKeys, campaignId }) {
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
