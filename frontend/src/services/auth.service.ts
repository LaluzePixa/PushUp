/**
 * Authentication Service
 * Handles user authentication operations
 */

import apiClient, { tokenUtils } from './api-client';
import type { ApiResponse, LoginCredentials, RegisterData, User } from '@/types/api';

export const authService = {
    /**
     * Login with credentials
     */
    async login(credentials: LoginCredentials): Promise<ApiResponse> {
        const response = await apiClient.post('/auth/login', credentials);

        if (response.token) {
            tokenUtils.set(response.token);
        }

        return response;
    },

    /**
     * Register new user
     */
    async register(userData: RegisterData): Promise<ApiResponse> {
        const response = await apiClient.post('/auth/register', userData);

        if (response.token) {
            tokenUtils.set(response.token);
        }

        return response;
    },

    /**
     * Get current user information
     */
    async getCurrentUser(): Promise<ApiResponse<User>> {
        return apiClient.get('/auth/me');
    },

    /**
     * Change password
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
        return apiClient.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
    },

    /**
     * Logout
     */
    logout(): void {
        tokenUtils.remove();
    }
};
