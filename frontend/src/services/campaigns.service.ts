/**
 * Campaigns Service
 * Handles campaign management operations
 */

import apiClient from './api-client';
import type { ApiResponse, Campaign, CampaignFormData } from '@/types/api';

export const campaignsService = {
    /**
     * Get campaigns list
     */
    async getCampaigns(options?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        siteId?: number;
    }): Promise<ApiResponse<{
        campaigns: Campaign[];
        pagination: {
            current: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.status) params.append('status', options.status);
        if (options?.search) params.append('search', options.search);
        if (options?.siteId) params.append('siteId', options.siteId.toString());

        const queryString = params.toString();
        const url = queryString ? `/campaigns?${queryString}` : '/campaigns';

        return apiClient.get(url);
    },

    /**
     * Create new campaign
     */
    async createCampaign(data: CampaignFormData): Promise<ApiResponse<Campaign>> {
        return apiClient.post('/campaigns', data);
    },

    /**
     * Get campaign by ID
     */
    async getCampaign(id: string | number): Promise<ApiResponse<Campaign>> {
        return apiClient.get(`/campaigns/${id}`);
    },

    /**
     * Update campaign
     */
    async updateCampaign(id: string | number, data: Partial<CampaignFormData>): Promise<ApiResponse<Campaign>> {
        return apiClient.put(`/campaigns/${id}`, data);
    },

    /**
     * Delete campaign
     */
    async deleteCampaign(id: string | number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/campaigns/${id}`);
    },

    /**
     * Pause scheduled campaign
     */
    async pauseCampaign(id: string | number): Promise<ApiResponse<Campaign>> {
        return apiClient.post(`/campaigns/${id}/pause`);
    },

    /**
     * Resume paused campaign
     */
    async resumeCampaign(id: string | number): Promise<ApiResponse<Campaign>> {
        return apiClient.post(`/campaigns/${id}/resume`);
    },

    /**
     * Send campaign immediately
     */
    async sendCampaign(id: string | number): Promise<ApiResponse<{
        sent: number;
        errors: number;
        total: number;
    }>> {
        return apiClient.post(`/campaigns/${id}/send`);
    }
};
