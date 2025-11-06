/**
 * Input Sanitization Utilities
 * Prevents SQL injection and other security issues
 */

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
