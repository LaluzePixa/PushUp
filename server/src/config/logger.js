import pino from 'pino';

/**
 * Pino Logger Configuration
 *
 * Pino is 6-8x faster than Winston, perfect for high-scale applications
 * Used by Netflix, Uber, and Red Hat
 *
 * Features:
 * - Structured JSON logging in production
 * - Pretty formatted logs in development
 * - Low overhead (<1ms per log)
 * - Async by default (doesn't block event loop)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Base logger configuration
const baseConfig = {
  level: logLevel,

  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'password_hash',
      'token',
      'authorization',
      'cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true, // Completely remove instead of replacing with [Redacted]
  },

  // Custom serializers for better log structure
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Add timestamp in ISO format
  timestamp: () => `,"time":"${new Date().toISOString()}"`,

  // Format error objects properly
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
        node_version: process.version,
      };
    },
  },
};

// Development: Pretty print with colors
// Production: JSON format for log aggregation
const logger = isDevelopment
  ? pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,node_version',
          singleLine: false,
          messageFormat: '{levelLabel} - {msg}',
          errorLikeObjectKeys: ['err', 'error'],
        },
      },
    })
  : pino(baseConfig);

/**
 * Create child logger with additional context
 * @param {Object} context - Additional fields to add to all logs
 * @returns {pino.Logger}
 */
export const createChildLogger = (context) => {
  return logger.child(context);
};

/**
 * Log levels:
 * - fatal (60): Application crash
 * - error (50): Error that needs attention
 * - warn (40): Warning that should be investigated
 * - info (30): General information
 * - debug (20): Debug information
 * - trace (10): Very detailed debugging
 */

export default logger;

// Convenience exports for different log types
export const logRequest = (req, message = 'Incoming request') => {
  logger.info({
    req: {
      id: req.id,
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.ip,
    },
  }, message);
};

export const logResponse = (req, res, responseTime, message = 'Response sent') => {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
  logger[level]({
    req: {
      id: req.id,
      method: req.method,
      url: req.url,
    },
    res: {
      statusCode: res.statusCode,
    },
    responseTime: `${responseTime}ms`,
  }, message);
};

export const logError = (error, context = {}) => {
  logger.error({
    err: error,
    ...context,
  }, error.message || 'An error occurred');
};

export const logAuth = (userId, action, success, metadata = {}) => {
  logger.info({
    userId,
    action,
    success,
    ...metadata,
  }, `Auth: ${action} - ${success ? 'success' : 'failed'}`);
};

export const logCampaign = (campaignId, action, metadata = {}) => {
  logger.info({
    campaignId,
    action,
    ...metadata,
  }, `Campaign: ${action}`);
};

export const logDatabase = (query, duration, metadata = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level]({
    query: query.substring(0, 100), // Limit query length
    duration: `${duration}ms`,
    ...metadata,
  }, 'Database query');
};
