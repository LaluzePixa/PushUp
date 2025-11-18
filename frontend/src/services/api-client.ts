/**
 * API Client
 * Base HTTP client with authentication handling
 */

import type { ApiError, ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Token management utilities
 * SECURITY: Tokens are now stored ONLY in HTTP-only cookies set by the server
 * This prevents XSS attacks as JavaScript cannot access HTTP-only cookies
 */
export const tokenUtils = {
    get: () => {
        // DEPRECATED: Tokens are now in HTTP-only cookies, not accessible from JS
        // This is a security feature - we rely on the server to set/read tokens
        console.warn('⚠️ tokenUtils.get() is deprecated. Tokens are in HTTP-only cookies.');
        return null;
    },

    set: (token: string) => {
        // DEPRECATED: Tokens must be set by the server as HTTP-only cookies
        // Client-side token storage is a security vulnerability
        console.warn('⚠️ tokenUtils.set() is deprecated. Server must set HTTP-only cookies.');
        console.log('🔒 Token received (will be set by server as HTTP-only cookie)');

        // For backward compatibility, we still send the token in the Authorization header
        // But we DON'T store it in localStorage (XSS vulnerability)
        // The server should set it as an HTTP-only cookie instead
    },

    remove: () => {
        if (typeof window !== 'undefined') {
            // Clean up any legacy localStorage tokens (migration)
            localStorage.removeItem('auth_token');

            // Note: HTTP-only cookies can only be removed by the server
            // This just clears any client-accessible cookies (for legacy support)
            document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
            console.log('🗑️ Legacy tokens cleared. Server will clear HTTP-only cookie.');
        }
    }
};

/**
 * Base HTTP client with authentication
 */
export class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // SECURITY: Authentication is now handled via HTTP-only cookies
        // The server will read the token from cookies, not from Authorization header
        // This prevents XSS attacks as JavaScript cannot access HTTP-only cookies

        const config: RequestInit = {
            ...options,
            credentials: 'include', // CRITICAL: Send HTTP-only cookies automatically
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Si el error es 401 (no autorizado), limpiar token expirado
                if (response.status === 401) {
                    console.warn('🔒 Token expirado o inválido, limpiando...');
                    tokenUtils.remove();
                }

                // Create error with full information
                const errorMessage = data.error || data.message || `HTTP ${response.status}`;
                const errorCode = data.code || 'UNKNOWN_ERROR';

                const error = new Error(errorMessage);
                (error as ApiError).status = response.status;
                (error as ApiError).code = errorCode;
                (error as ApiError).details = data.details || null;

                throw error;
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Public API calls (without authentication)
     */
    async publicGet<T>(endpoint: string): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            console.log(`[publicGet] Calling: ${url}`);
            const response = await fetch(url, config);
            console.log(`[publicGet] Status: ${response.status}, OK: ${response.ok}`);

            const data = await response.json();
            console.log(`[publicGet] Data received:`, data);

            if (!response.ok) {
                const errorMessage = data.error || data.message || `HTTP ${response.status}`;
                const errorCode = data.code || 'UNKNOWN_ERROR';

                const error = new Error(errorMessage);
                (error as ApiError).status = response.status;
                (error as ApiError).code = errorCode;
                (error as ApiError).details = data.details || null;

                console.error(`[publicGet] Error response:`, error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`[publicGet] API Error [${endpoint}]:`, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

/**
 * Health check utility
 */
export const healthCheck = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/healthz`);
        return response.ok;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
};
