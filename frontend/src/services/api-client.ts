/**
 * API Client
 * Base HTTP client with authentication handling
 */

import type { ApiError, ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Token management utilities
 */
export const tokenUtils = {
    get: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    },

    set: (token: string) => {
        if (typeof window !== 'undefined') {
            // Save to localStorage
            localStorage.setItem('auth_token', token);

            // Also save to cookie for middleware
            const expires = new Date();
            expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

            const cookieString = [
                `auth-token=${token}`,
                `expires=${expires.toUTCString()}`,
                `path=/`,
                `SameSite=Lax`
            ].join(';');

            document.cookie = cookieString;
            console.log('🍪 Token saved to cookie and localStorage:', token.substring(0, 20) + '...');
        }
    },

    remove: () => {
        if (typeof window !== 'undefined') {
            // Remove from localStorage
            localStorage.removeItem('auth_token');

            // Remove cookie
            document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('🗑️ Token removed from cookie and localStorage');
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
        const token = tokenUtils.get();

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Solo agregar token si existe (para compatibilidad con sistema antiguo)
        // Las cookies HTTP-only se envían automáticamente con credentials: 'include'
        if (token) {
            defaultHeaders.Authorization = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...options,
            credentials: 'include', // Enviar cookies automáticamente
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
