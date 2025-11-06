// Artillery custom functions for load testing
// This file provides helper functions for Artillery scenarios

/**
 * Generate a random future date (1-7 days from now)
 */
export function generateFutureDate(requestParams, context, ee, next) {
    const now = new Date();
    const daysToAdd = Math.floor(Math.random() * 7) + 1; // 1-7 days
    const futureDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

    context.vars.futureDate = futureDate.toISOString();
    return next();
}

/**
 * Generate random campaign data
 */
export function generateCampaignData(requestParams, context, ee, next) {
    const titles = [
        'Flash Sale Alert',
        'New Feature Announcement',
        'Limited Time Offer',
        'Important Update',
        'Exclusive Deal'
    ];

    const bodies = [
        'Don\'t miss out on this amazing opportunity!',
        'Check out our latest update just for you',
        'Limited time only - act now!',
        'We have something special to share',
        'Your exclusive access starts now'
    ];

    context.vars.randomTitle = titles[Math.floor(Math.random() * titles.length)];
    context.vars.randomBody = bodies[Math.floor(Math.random() * bodies.length)];

    return next();
}

/**
 * Log custom metrics
 */
export function logMetrics(requestParams, response, context, ee, next) {
    if (response.body) {
        const body = JSON.parse(response.body);

        // Log campaign execution metrics if available
        if (body.execution) {
            ee.emit('counter', 'campaigns.sent', body.execution.sent || 0);
            ee.emit('counter', 'campaigns.failed', body.execution.failed || 0);
            ee.emit('counter', 'campaigns.total', body.execution.total || 0);

            if (body.execution.total > 0) {
                const successRate = (body.execution.sent / body.execution.total) * 100;
                ee.emit('histogram', 'campaigns.success_rate', successRate);
            }
        }
    }

    return next();
}

/**
 * Random delay to simulate user think time
 */
export function randomThink(requestParams, context, ee, next) {
    const thinkTime = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
    setTimeout(next, thinkTime);
}

/**
 * Validate response has required fields
 */
export function validateCampaignResponse(requestParams, response, context, ee, next) {
    if (response.statusCode === 201) {
        const body = JSON.parse(response.body);

        if (!body.campaign || !body.campaign.id) {
            ee.emit('counter', 'validation.errors.missing_campaign_id', 1);
        }

        if (!body.execution) {
            ee.emit('counter', 'validation.errors.missing_execution', 1);
        }

        if (body.execution && body.execution.total > 0) {
            ee.emit('counter', 'validation.success', 1);
        }
    }

    return next();
}
