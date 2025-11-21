/**
 * Dashboard Service
 * Handles dashboard metrics and analytics operations
 */

import apiClient from './api-client';
import type {
    ApiResponse,
    DashboardMetrics,
    AnalyticsDataPoint,
    Subscription,
    UserSegment,
    RecentCampaign,
    Journey,
    MonitoringLocation
} from '@/types/api';

export const dashboardService = {
    /**
     * Get dashboard metrics
     */
    async getMetrics(siteId?: number): Promise<ApiResponse<DashboardMetrics>> {
        const params = siteId ? `?siteId=${siteId}` : '';
        return apiClient.get(`/dashboard/metrics${params}`);
    },

    /**
     * Get analytics data for charts
     */
    async getAnalytics(period: number = 30, siteId?: number): Promise<ApiResponse<AnalyticsDataPoint[]>> {
        const params = new URLSearchParams();
        params.append('period', period.toString());
        if (siteId) params.append('siteId', siteId.toString());
        return apiClient.get(`/dashboard/analytics?${params.toString()}`);
    },

    /**
     * Get recent subscriptions
     */
    async getSubscriptions(limit: number = 10, page: number = 1, siteId?: number): Promise<ApiResponse<Subscription[]>> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('page', page.toString());
        if (siteId) params.append('siteId', siteId.toString());
        return apiClient.get(`/dashboard/subscriptions?${params.toString()}`);
    },

    /**
     * Get user segments available (simplified format for dropdowns)
     * Note: For full segment management, use segmentsService
     */
    async getSegments(): Promise<ApiResponse<UserSegment[]>> {
        return apiClient.get('/dashboard/segments');
    },

    /**
     * Get recent campaigns for preview
     */
    async getRecentCampaigns(limit: number = 5, siteId?: number): Promise<ApiResponse<RecentCampaign[]>> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (siteId) params.append('siteId', siteId.toString());
        return apiClient.get(`/dashboard/recent-campaigns?${params.toString()}`);
    },

    /**
     * Get user journeys
     */
    async getJourneys(options?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<{
        journeys: Journey[];
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

        const queryString = params.toString();
        const url = queryString ? `/dashboard/journeys?${queryString}` : '/dashboard/journeys';

        return apiClient.get(url);
    },

    /**
     * Get monitoring locations
     */
    async getMonitoringLocations(): Promise<ApiResponse<{
        locations: MonitoringLocation[];
        total: number;
        enabled: number;
    }>> {
        return apiClient.get('/dashboard/monitoring-locations');
    },

    /**
     * Get geographic data for subscribers
     */
    async getGeoReport(siteId?: number): Promise<ApiResponse<{
        countries: Array<{ name: string; count: number }>;
        states: Array<{ name: string; count: number }>;
        cities: Array<{ name: string; count: number }>;
        activeUsers: number;
    }>> {
        const params = siteId ? `?siteId=${siteId}` : '';
        return apiClient.get(`/dashboard/geo-report${params}`);
    }
};
