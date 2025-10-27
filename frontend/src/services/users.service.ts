/**
 * Users Service
 * Handles user management operations (admin only)
 */

import apiClient from './api-client';
import type { ApiResponse, User, PaginationData } from '@/types/api';

export const usersService = {
    /**
     * Get users list
     */
    async getUsers(params?: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<{ users: User[]; pagination: PaginationData }>> {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.role) searchParams.append('role', params.role);
        if (params?.search) searchParams.append('search', params.search);
        if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

        const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return apiClient.get(endpoint);
    },

    /**
     * Get specific user
     */
    async getUser(id: number): Promise<ApiResponse<User>> {
        return apiClient.get(`/users/${id}`);
    },

    /**
     * Update user
     */
    async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
        return apiClient.put(`/users/${id}`, userData);
    },

    /**
     * Delete user
     */
    async deleteUser(id: number): Promise<ApiResponse> {
        return apiClient.delete(`/users/${id}`);
    }
};
