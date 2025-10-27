/**
 * Services Index
 * Central export point for all API services
 * Maintains backward compatibility with existing imports
 */

// Re-export API client and utilities
export { default as apiClient, tokenUtils, healthCheck } from './api-client';

// Re-export all services
export { authService } from './auth.service';
export { sitesService } from './sites.service';
export { pushService } from './push.service';
export { usersService } from './users.service';
export { dashboardService } from './dashboard.service';
export { campaignsService } from './campaigns.service';
export { segmentsService } from './segments.service';
export { optinsService } from './optins.service';

// Re-export all types
export type {
    // Base types
    ApiError,
    ApiResponse,
    PaginationData,

    // User types
    User,
    LoginCredentials,
    RegisterData,

    // Site types
    Site,

    // Push types
    PushSubscription,

    // Dashboard types
    DashboardMetric,
    DashboardMetrics,
    AnalyticsDataPoint,
    Subscription,
    UserSegment,
    RecentCampaign,
    Journey,
    MonitoringLocation,

    // Segment types
    SegmentConditions,
    Subscriber,
    Segment,
    SegmentFormData,

    // Campaign types
    Campaign,
    CampaignFormData,

    // Opt-in types
    OptinConfig,
    OptinConfigFormData,
} from '@/types/api';

// Default export for backward compatibility
import apiClient from './api-client';
export default apiClient;
