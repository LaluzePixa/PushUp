/**
 * Sites Service
 * Handles site management operations
 */

import apiClient from './api-client';
import type { ApiResponse, Site, PaginationData } from '@/types/api';

export const sitesService = {
    /**
     * Get user's sites
     */
    async getSites(params?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<{ sites: Site[]; pagination: PaginationData }>> {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);
        if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

        const endpoint = `/sites${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return apiClient.get(endpoint);
    },

    /**
     * Create new site
     */
    async createSite(siteData: {
        name: string;
        domain: string;
        description?: string;
    }): Promise<ApiResponse<Site>> {
        return apiClient.post('/sites', siteData);
    },

    /**
     * Get specific site
     */
    async getSite(id: number): Promise<ApiResponse<Site>> {
        return apiClient.get(`/sites/${id}`);
    },

    /**
     * Update site
     */
    async updateSite(id: number, siteData: Partial<Site>): Promise<ApiResponse<Site>> {
        return apiClient.put(`/sites/${id}`, siteData);
    },

    /**
     * Delete site
     */
    async deleteSite(id: number): Promise<ApiResponse> {
        return apiClient.delete(`/sites/${id}`);
    }
};
