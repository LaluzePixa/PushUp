/**
 * Opt-in Prompts Service
 * Handles opt-in prompt configuration operations
 */

import apiClient from './api-client';
import type { ApiResponse, OptinConfig, OptinConfigFormData } from '@/types/api';

export const optinsService = {
    /**
     * Get opt-in prompt configuration
     */
    async getConfig(siteId?: number): Promise<ApiResponse<OptinConfig>> {
        const params = new URLSearchParams();
        if (siteId) params.append('siteId', siteId.toString());

        const queryString = params.toString();
        const url = queryString ? `/optins?${queryString}` : '/optins';

        return apiClient.get(url);
    },

    /**
     * Save opt-in prompt configuration
     */
    async saveConfig(data: OptinConfigFormData): Promise<ApiResponse<OptinConfig>> {
        return apiClient.post('/optins', data);
    },

    /**
     * Get specific configuration by ID
     */
    async getConfigById(id: number): Promise<ApiResponse<OptinConfig>> {
        return apiClient.get(`/optins/${id}`);
    },

    /**
     * Update opt-in prompt configuration
     */
    async updateConfig(id: number, data: Partial<OptinConfigFormData>): Promise<ApiResponse<OptinConfig>> {
        return apiClient.put(`/optins/${id}`, data);
    },

    /**
     * Delete opt-in prompt configuration
     */
    async deleteConfig(id: number): Promise<ApiResponse<void>> {
        return apiClient.delete(`/optins/${id}`);
    },

    /**
     * Generate integration code
     */
    async generateCode(
        id: number,
        format: 'javascript' | 'html' | 'react' = 'javascript',
        siteId?: number
    ): Promise<ApiResponse<{
        code: string;
        format: string;
        config: OptinConfig;
    }>> {
        const params = new URLSearchParams();
        params.append('format', format);
        if (siteId) params.append('siteId', siteId.toString());

        const queryString = params.toString();
        return apiClient.get(`/optins/${id}/code?${queryString}`);
    }
};
