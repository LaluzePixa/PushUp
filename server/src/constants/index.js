/**
 * Backend Constants
 * Centralized constants to avoid magic numbers and improve maintainability
 */

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Password Requirements
 * Must match frontend validation
 */
export const PASSWORD = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  SALT_ROUNDS: 10,
};

/**
 * JWT Configuration
 */
export const JWT = {
  DEFAULT_EXPIRES_IN: '24h',
};

/**
 * User Roles
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

/**
 * Batch Processing
 */
export const BATCH = {
  CAMPAIGN_SEND_SIZE: 100, // Number of notifications to send per batch
  SUBSCRIBER_FETCH_SIZE: 1000,
};

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

/**
 * Rate Limiting
 * Requests per time window
 */
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  REGISTER: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3,
  },
  API_GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
};

/**
 * Error Codes
 */
export const ERROR_CODES = {
  // Authentication
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_DISABLED: 'USER_DISABLED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',

  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_ROLE: 'INVALID_ROLE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
};

/**
 * HTTP Status Codes
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
};

/**
 * Database Connection Pool
 */
export const DB_POOL = {
  MAX_CONNECTIONS: 20,
  MIN_CONNECTIONS: 5,
  IDLE_TIMEOUT_MS: 30000,
  CONNECTION_TIMEOUT_MS: 5000,
};

/**
 * Timezone
 */
export const TIMEZONE = {
  DEFAULT: 'America/Los_Angeles',
};

/**
 * Campaign Status
 */
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  PAUSED: 'paused',
  FAILED: 'failed',
};

/**
 * Subscription Status
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
};

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};
