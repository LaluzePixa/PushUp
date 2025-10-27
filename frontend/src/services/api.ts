/**
 * API Services - Backward Compatibility Layer
 *
 * This file maintains backward compatibility with existing code.
 * All services have been reorganized into domain-specific files:
 *
 * - services/auth.service.ts
 * - services/sites.service.ts
 * - services/campaigns.service.ts
 * - services/segments.service.ts
 * - services/dashboard.service.ts
 * - services/users.service.ts
 * - services/push.service.ts
 * - services/optins.service.ts
 *
 * Types have been moved to types/api.ts
 */

// Re-export everything from centralized index
export * from './index';
export { default } from './index';
