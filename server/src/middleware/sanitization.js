/**
 * Input Sanitization Middleware
 * Automatically sanitizes all incoming request data to prevent XSS and injection attacks
 */

import { sanitizeHTML, sanitizeText, validateDomain, validateType } from '../utils/sanitize.js';
import logger from '../config/logger.js';

/**
 * Recursively sanitize an object's string values
 * @param {*} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj, options = {}) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return sanitizeText(obj, {
      maxLength: options.maxLength || 10000,
      allowHTML: false,
      allowNewlines: true,
    });
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key], options);
      }
    }
    return sanitized;
  }

  // Return other types as-is (numbers, booleans, etc.)
  return obj;
}

/**
 * Middleware to sanitize request body
 * Applies to POST, PUT, PATCH requests
 */
export function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeObject(req.body);
    } catch (error) {
      logger.error({ err: error }, 'Error sanitizing request body');
      return res.status(400).json({
        success: false,
        error: {
          code: 'SANITIZATION_ERROR',
          message: 'Invalid request data'
        }
      });
    }
  }

  next();
}

/**
 * Middleware to sanitize query parameters
 * Applies to GET requests with query strings
 */
export function sanitizeQueryParams(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    try {
      req.query = sanitizeObject(req.query, {
        maxLength: 500, // Query params should be shorter
      });
    } catch (error) {
      logger.error({ err: error }, 'Error sanitizing query params');
      return res.status(400).json({
        success: false,
        error: {
          code: 'SANITIZATION_ERROR',
          message: 'Invalid query parameters'
        }
      });
    }
  }

  next();
}

/**
 * Middleware to validate site creation/update data
 * Validates domain format and required fields
 */
export function validateSiteData(req, res, next) {
  const { name, domain } = req.body;

  // Validate name
  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Site name is required and must be a string',
        field: 'name'
      }
    });
  }

  if (name.length < 1 || name.length > 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Site name must be between 1 and 100 characters',
        field: 'name'
      }
    });
  }

  // Validate domain if provided
  if (domain) {
    const domainValidation = validateDomain(domain);

    if (!domainValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: domainValidation.error || 'Invalid domain format',
          field: 'domain'
        }
      });
    }

    // Use the sanitized domain
    req.body.domain = domainValidation.sanitized;
  }

  next();
}

/**
 * Middleware to validate campaign data
 * Validates required string fields and prevents object injection
 */
export function validateCampaignData(req, res, next) {
  const { name, title, body, siteId } = req.body;

  // Validate name (string, required)
  const nameValidation = validateType(name, 'string');
  if (!nameValidation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campaign name must be a string',
        detail: nameValidation.error,
        field: 'name'
      }
    });
  }

  // Validate title (string, required)
  const titleValidation = validateType(title, 'string');
  if (!titleValidation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campaign title must be a string',
        detail: titleValidation.error,
        field: 'title'
      }
    });
  }

  // Validate body (string, required)
  const bodyValidation = validateType(body, 'string');
  if (!bodyValidation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campaign body must be a string',
        detail: bodyValidation.error,
        field: 'body'
      }
    });
  }

  // Validate siteId (number, required)
  if (siteId !== undefined) {
    const siteIdValidation = validateType(siteId, 'number');
    if (!siteIdValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Site ID must be a number',
          detail: siteIdValidation.error,
          field: 'siteId'
        }
      });
    }
  }

  // Validate lengths
  if (!name || name.length < 1 || name.length > 200) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campaign name must be between 1 and 200 characters',
        field: 'name'
      }
    });
  }

  if (!title || title.length < 1 || title.length > 100) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campaign title must be between 1 and 100 characters',
        field: 'title'
      }
    });
  }

  if (!body || body.length < 1 || body.length > 500) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Campaign body must be between 1 and 500 characters',
        field: 'body'
      }
    });
  }

  next();
}

/**
 * General validation middleware
 * Prevents common injection attacks
 */
export function validateRequestData(req, res, next) {
  // Log suspicious patterns for monitoring
  const bodyStr = JSON.stringify(req.body || {});

  const suspiciousPatterns = [
    { pattern: /<script/i, type: 'XSS_SCRIPT' },
    { pattern: /javascript:/i, type: 'JAVASCRIPT_PROTOCOL' },
    { pattern: /on\w+\s*=/i, type: 'EVENT_HANDLER' },
    { pattern: /\$ne|\$gt|\$lt/i, type: 'NOSQL_OPERATOR' },
  ];

  for (const { pattern, type } of suspiciousPatterns) {
    if (pattern.test(bodyStr)) {
      logger.warn({
        type: 'SUSPICIOUS_INPUT',
        pattern: type,
        ip: req.ip,
        path: req.path,
        method: req.method
      }, 'Suspicious input pattern detected');
    }
  }

  next();
}
