import logger from '../config/logger.js';

/**
 * Security Event Logger
 * Logs security-related events for monitoring and auditing
 */

/**
 * Security Event Types
 */
export const SecurityEvents = {
  // Authentication events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  LOGOUT: 'LOGOUT',

  // Authorization events
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Account events
  ACCOUNT_CREATED: 'ACCOUNT_CREATED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',

  // Password events
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',

  // Session events
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',

  // Security violations
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  CSRF_VIOLATION: 'CSRF_VIOLATION',

  // Data access events
  SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_EXPORT: 'BULK_DATA_EXPORT',

  // Configuration changes
  SECURITY_CONFIG_CHANGED: 'SECURITY_CONFIG_CHANGED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSIONS_MODIFIED: 'PERMISSIONS_MODIFIED'
};

/**
 * Security Event Severity Levels
 */
export const SecuritySeverity = {
  INFO: 'info',
  WARNING: 'warn',
  ERROR: 'error',
  CRITICAL: 'fatal'
};

/**
 * Log a security event
 * @param {string} event - Event type from SecurityEvents
 * @param {object} details - Event details
 * @param {object} req - Express request object (optional)
 */
export function logSecurityEvent(event, details = {}, req = null) {
  const severity = getEventSeverity(event);

  const logData = {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details
  };

  // Add request context if available
  if (req) {
    logData.context = {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role
    };
  }

  // Log based on severity
  switch (severity) {
    case SecuritySeverity.CRITICAL:
      logger.fatal(logData, `[SECURITY] ${event}`);
      break;
    case SecuritySeverity.ERROR:
      logger.error(logData, `[SECURITY] ${event}`);
      break;
    case SecuritySeverity.WARNING:
      logger.warn(logData, `[SECURITY] ${event}`);
      break;
    default:
      logger.info(logData, `[SECURITY] ${event}`);
  }

  // In production, you might want to send critical events to monitoring service
  if (process.env.NODE_ENV === 'production' && severity === SecuritySeverity.CRITICAL) {
    // sendToMonitoringService(logData);
  }
}

/**
 * Get severity level for an event type
 */
function getEventSeverity(event) {
  const criticalEvents = [
    SecurityEvents.SQL_INJECTION_ATTEMPT,
    SecurityEvents.ACCOUNT_LOCKED,
    SecurityEvents.BULK_DATA_EXPORT,
    SecurityEvents.SECURITY_CONFIG_CHANGED,
    SecurityEvents.PERMISSIONS_MODIFIED
  ];

  const errorEvents = [
    SecurityEvents.LOGIN_BLOCKED,
    SecurityEvents.UNAUTHORIZED_ACCESS,
    SecurityEvents.XSS_ATTEMPT,
    SecurityEvents.CSRF_VIOLATION,
    SecurityEvents.SUSPICIOUS_ACTIVITY
  ];

  const warningEvents = [
    SecurityEvents.LOGIN_FAILED,
    SecurityEvents.PERMISSION_DENIED,
    SecurityEvents.RATE_LIMIT_EXCEEDED,
    SecurityEvents.INVALID_TOKEN,
    SecurityEvents.PASSWORD_RESET_REQUESTED
  ];

  if (criticalEvents.includes(event)) return SecuritySeverity.CRITICAL;
  if (errorEvents.includes(event)) return SecuritySeverity.ERROR;
  if (warningEvents.includes(event)) return SecuritySeverity.WARNING;
  return SecuritySeverity.INFO;
}

/**
 * Convenience functions for common security events
 */

export function logLoginAttempt(success, details, req) {
  logSecurityEvent(
    success ? SecurityEvents.LOGIN_SUCCESS : SecurityEvents.LOGIN_FAILED,
    details,
    req
  );
}

export function logLogout(details, req) {
  logSecurityEvent(SecurityEvents.LOGOUT, details, req);
}

export function logUnauthorizedAccess(details, req) {
  logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, details, req);
}

export function logPasswordChange(details, req) {
  logSecurityEvent(SecurityEvents.PASSWORD_CHANGED, details, req);
}

export function logAccountCreation(details, req) {
  logSecurityEvent(SecurityEvents.ACCOUNT_CREATED, details, req);
}

export function logSuspiciousActivity(details, req) {
  logSecurityEvent(SecurityEvents.SUSPICIOUS_ACTIVITY, details, req);
}

export function logRateLimitExceeded(details, req) {
  logSecurityEvent(SecurityEvents.RATE_LIMIT_EXCEEDED, details, req);
}

export function logInvalidToken(details, req) {
  logSecurityEvent(SecurityEvents.INVALID_TOKEN, details, req);
}

/**
 * Middleware to log all authentication attempts
 */
export function securityAuditMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function(body) {
    // Log authentication endpoints
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      const success = res.statusCode === 200 || res.statusCode === 201;
      const event = req.path.includes('/login')
        ? (success ? SecurityEvents.LOGIN_SUCCESS : SecurityEvents.LOGIN_FAILED)
        : SecurityEvents.ACCOUNT_CREATED;

      logSecurityEvent(event, {
        success,
        statusCode: res.statusCode,
        email: req.body?.email
      }, req);
    }

    return originalJson(body);
  };

  next();
}

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(input) {
  const suspiciousPatterns = [
    /(\bor\b|\band\b).*=.*\b/i,
    /union.*select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /update.*set/i,
    /delete\s+from/i,
    /exec(\s|\()+/i,
    /script.*>/i,
    /javascript:/i,
    /';\s*(drop|delete|insert|update)/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS attempts
 */
export function detectXSS(input) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Monitor and log suspicious input
 */
export function monitorInput(req, res, next) {
  const checkInput = (input, source) => {
    if (typeof input === 'string') {
      if (detectSQLInjection(input)) {
        logSecurityEvent(SecurityEvents.SQL_INJECTION_ATTEMPT, {
          input: input.substring(0, 100), // Log first 100 chars
          source
        }, req);
      }

      if (detectXSS(input)) {
        logSecurityEvent(SecurityEvents.XSS_ATTEMPT, {
          input: input.substring(0, 100),
          source
        }, req);
      }
    } else if (typeof input === 'object' && input !== null) {
      Object.values(input).forEach(value => checkInput(value, source));
    }
  };

  // Check query params
  checkInput(req.query, 'query');

  // Check body
  checkInput(req.body, 'body');

  next();
}
