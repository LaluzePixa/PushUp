/**
 * Push Notifications Service
 * Handles push notification subscription and sending
 */

import apiClient from './api-client';
import type { ApiResponse, PushSubscription } from '@/types/api';

export const pushService = {
    /**
     * Get VAPID public key (public, no authentication)
     */
    async getVapidPublicKey(): Promise<ApiResponse<{ publicKey: string }>> {
        return apiClient.publicGet('/vapid-public-key');
    },

    /**
     * Subscribe device to push notifications
     */
    async subscribe(subscription: PushSubscription): Promise<ApiResponse<{ id: number }>> {
        return apiClient.post('/subscribe', subscription);
    },

    /**
     * Send push notification (admin only)
     */
    async sendNotification(params: {
        title?: string;
        body?: string;
        url?: string;
        endpoint?: string;
        siteId?: number;
        userId?: number;
    }): Promise<ApiResponse<{
        sent: number;
        removed: number;
        errors: number;
        total: number;
    }>> {
        return apiClient.post('/send', params);
    }
};
