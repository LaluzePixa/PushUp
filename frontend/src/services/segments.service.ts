/**
 * Segments Service
 * Handles user segment management operations
 */

import apiClient from './api-client';
import type { ApiResponse, Segment, SegmentFormData, Subscriber, PaginationData } from '@/types/api';

export const segmentsService = {
    /**
     * List all segments with filters
     */
    async list(options?: {
        page?: number;
        limit?: number;
        siteId?: number;
        search?: string;
    }): Promise<ApiResponse<{
        segments: Segment[];
        pagination: PaginationData;
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.siteId) params.append('siteId', options.siteId.toString());
        if (options?.search) params.append('search', options.search);

        const queryString = params.toString();
        const url = queryString ? `/segments?${queryString}` : '/segments';

        return apiClient.get(url);
    },

    /**
     * Get segment by ID
     */
    async getById(id: number): Promise<ApiResponse<Segment>> {
        return apiClient.get(`/segments/${id}`);
    },

    /**
     * Create new segment
     */
    async create(data: SegmentFormData): Promise<ApiResponse<Segment>> {
        return apiClient.post('/segments', data);
    },

    /**
     * Update existing segment
     */
    async update(id: number, data: Partial<SegmentFormData>): Promise<ApiResponse<Segment>> {
        return apiClient.put(`/segments/${id}`, data);
    },

    /**
     * Delete segment
     */
    async delete(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/segments/${id}`);
    },

    /**
     * Get subscribers matching a segment
     */
    async getSubscribers(id: number, options?: {
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<{
        subscribers: Subscriber[];
        pagination: PaginationData;
    }>> {
        const params = new URLSearchParams();

        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());

        const queryString = params.toString();
        const url = queryString ? `/segments/${id}/subscribers?${queryString}` : `/segments/${id}/subscribers`;

        return apiClient.get(url);
    }
};
