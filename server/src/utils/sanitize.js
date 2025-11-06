/**
 * Input Sanitization Utilities
 * Prevents SQL injection, XSS, and other security issues
 */

import validator from 'validator';
import xss from 'xss';

/**
 * Sanitize input for LIKE/ILIKE queries
 * Escapes special SQL pattern characters: % and _
 *
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input safe for LIKE/ILIKE
 *
 * @example
 * sanitizeForLike("user%test") // Returns "user\\%test"
 * sanitizeForLike("user_test") // Returns "user\\_test"
 */
export function sanitizeForLike(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Escape % and _ characters that have special meaning in LIKE/ILIKE
  // % matches any sequence of characters
  // _ matches any single character
  return input.replace(/[%_]/g, '\\$&');
}

/**
 * Sanitize input for general use
 * Trims whitespace and removes null bytes
 *
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/\0/g, ''); // Remove null bytes
}

/**
 * Validate and sanitize email input
 *
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, sanitized: string}} Validation result and sanitized email
 */
export function sanitizeEmail(email) {
  const sanitized = sanitizeInput(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return {
    valid: emailRegex.test(sanitized),
    sanitized,
  };
}

/**
 * Sanitize numeric input
 *
 * @param {string|number} input - Numeric input
 * @param {Object} options - Options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {number} options.default - Default value if invalid
 * @returns {number} Sanitized number
 */
export function sanitizeNumber(input, options = {}) {
  const { min, max, default: defaultValue = 0 } = options;

  const num = parseInt(input, 10);

  if (isNaN(num)) {
    return defaultValue;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Sanitize pagination parameters
 *
 * @param {Object} params - Pagination params
 * @param {string|number} params.page - Page number
 * @param {string|number} params.limit - Items per page
 * @returns {{page: number, limit: number}} Sanitized pagination
 */
export function sanitizePagination({ page, limit }) {
  return {
    page: sanitizeNumber(page, { min: 1, default: 1 }),
    limit: sanitizeNumber(limit, { min: 1, max: 100, default: 10 }),
  };
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous content
 *
 * @param {string} input - Input that may contain HTML
 * @param {Object} options - Sanitization options
 * @param {boolean} options.allowSafeHTML - If true, allows safe HTML tags
 * @returns {string} Sanitized input
 *
 * @example
 * sanitizeHTML('<script>alert(1)</script>') // Returns empty string or safe text
 * sanitizeHTML('<p>Hello</p>', { allowSafeHTML: true }) // Returns '<p>Hello</p>'
 */
export function sanitizeHTML(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const { allowSafeHTML = false } = options;

  if (allowSafeHTML) {
    // Use xss library to allow safe HTML tags
    return xss(input, {
      whiteList: {
        p: [],
        br: [],
        strong: [],
        em: [],
        u: [],
        a: ['href', 'title'],
        ul: [],
        ol: [],
        li: [],
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });
  }

  // Strip ALL HTML tags
  return validator.stripLow(
    input.replace(/<[^>]*>/g, ''), // Remove all tags
    true // Keep newlines
  );
}

/**
 * Strip control characters from input
 * Removes null bytes, newlines, tabs, etc.
 *
 * @param {string} input - Input to clean
 * @param {Object} options - Options
 * @param {boolean} options.keepNewlines - Keep \n and \r
 * @returns {string} Cleaned input
 */
export function stripControlCharacters(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const { keepNewlines = false } = options;

  if (keepNewlines) {
    // Remove control characters except newlines
    return input.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  // Remove all control characters including newlines
  return input.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize domain name
 *
 * @param {string} domain - Domain to validate
 * @returns {{valid: boolean, sanitized: string, error?: string}} Validation result
 *
 * @example
 * validateDomain('example.com') // { valid: true, sanitized: 'example.com' }
 * validateDomain('javascript:alert(1)') // { valid: false, error: 'Invalid domain format' }
 */
export function validateDomain(domain) {
  if (typeof domain !== 'string') {
    return { valid: false, sanitized: '', error: 'Domain must be a string' };
  }

  const sanitized = sanitizeInput(domain).toLowerCase();

  // Check for malicious patterns
  if (sanitized.includes('javascript:') ||
      sanitized.includes('data:') ||
      sanitized.includes('vbscript:') ||
      sanitized.includes('<') ||
      sanitized.includes('>')) {
    return {
      valid: false,
      sanitized: '',
      error: 'Domain contains invalid characters'
    };
  }

  // Validate domain format using validator
  if (!validator.isFQDN(sanitized, {
    require_tld: true,
    allow_underscores: false,
    allow_trailing_dot: false
  })) {
    return {
      valid: false,
      sanitized,
      error: 'Invalid domain format'
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate that a value is of expected type
 * Prevents NoSQL injection and type confusion attacks
 *
 * @param {*} value - Value to validate
 * @param {string} expectedType - Expected type ('string', 'number', 'boolean', 'object', 'array')
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateType(value, expectedType) {
  const actualType = Array.isArray(value) ? 'array' : typeof value;

  if (actualType !== expectedType) {
    return {
      valid: false,
      error: `Expected ${expectedType}, got ${actualType}`
    };
  }

  // Additional checks for objects to prevent NoSQL injection
  if (expectedType === 'string' && typeof value === 'object') {
    return {
      valid: false,
      error: 'Objects not allowed in string fields'
    };
  }

  return { valid: true };
}

/**
 * Sanitize text input with comprehensive cleaning
 * Combines multiple sanitization techniques
 *
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @param {number} options.maxLength - Maximum length
 * @param {boolean} options.allowHTML - Allow safe HTML
 * @param {boolean} options.allowNewlines - Allow newlines
 * @returns {string} Fully sanitized input
 */
export function sanitizeText(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 10000,
    allowHTML = false,
    allowNewlines = true,
  } = options;

  let sanitized = input;

  // 1. Strip or sanitize HTML
  sanitized = sanitizeHTML(sanitized, { allowSafeHTML: allowHTML });

  // 2. Strip control characters
  sanitized = stripControlCharacters(sanitized, { keepNewlines: allowNewlines });

  // 3. Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // 4. Trim whitespace
  sanitized = sanitized.trim();

  // 5. Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
