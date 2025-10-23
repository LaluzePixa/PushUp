/**
 * Application Constants
 * Centralized constants to avoid magic numbers and hardcoded values throughout the app
 *
 * BEST PRACTICE: Never hardcode values in components - use constants instead
 */

/**
 * Application Metadata
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'PushSaaS';
export const APP_DESCRIPTION = 'Professional push notification platform for SaaS';

/**
 * API Configuration
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

/**
 * Service Worker Configuration
 */
export const SW_PATH = process.env.NEXT_PUBLIC_SW_PATH || '/pushsaas-sw.js';
export const SW_SCOPE = '/';

/**
 * Responsive Breakpoints (in pixels)
 * Based on Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
} as const;

/**
 * Local Storage Keys
 * Centralized to avoid typos and inconsistencies
 */
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  selectedSiteId: 'selectedSiteId',
  userEmail: 'user-email',
  theme: 'theme',
} as const;

/**
 * Cookie Names
 */
export const COOKIE_NAMES = {
  authToken: 'auth-token',
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  campaigns: '/campaigns',
  segments: '/segments',
  subscribers: '/subscribers',
  sites: '/sites',
  analytics: '/dashboard/analytics',
} as const;

/**
 * Authentication Constants
 */
export const AUTH = {
  tokenExpiry: '24h',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in ms
} as const;

/**
 * Password Requirements
 * Should match backend validation
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*(),.?":{}|<>',
} as const;

/**
 * Chart/Analytics Defaults
 */
export const ANALYTICS = {
  defaultTimeRange: 30,
  timeRangeOptions: [7, 14, 30, 60, 90] as const,
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  user: 'user',
  admin: 'admin',
  superadmin: 'superadmin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * HTTP Status Codes (commonly used)
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error Codes (from backend)
 */
export const ERROR_CODES = {
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Toast/Notification Durations (in ms)
 */
export const TOAST_DURATION = {
  short: 2000,
  medium: 3000,
  long: 5000,
} as const;

/**
 * Animation Durations (in ms)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * z-index Layers
 * Helps maintain consistent stacking contexts
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  short: 'dd/MM/yy',
  medium: 'dd/MM/yyyy',
  long: 'dd MMMM yyyy',
  timestamp: 'dd/MM/yyyy HH:mm',
} as const;

/**
 * Feature Flags (for gradual rollouts)
 */
export const FEATURE_FLAGS = {
  enablePushNotifications: true,
  enableEmailCollection: true,
  enableAnalytics: true,
  enableJourneys: process.env.NEXT_PUBLIC_ENABLE_JOURNEYS === 'true',
  enableUptime: process.env.NEXT_PUBLIC_ENABLE_UPTIME === 'true',
} as const;
