import { PAGINATION, HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

/**
 * Validates and sanitizes pagination parameters
 *
 * @param {object} query - Request query parameters
 * @param {number} query.page - Page number (optional)
 * @param {number} query.limit - Items per page (optional)
 * @returns {object} Validated pagination parameters
 *
 * SECURITY: Prevents SQL errors and DoS attacks via invalid pagination params
 */
export function validatePagination(query = {}) {
  // Parse and validate page
  let page = parseInt(query.page);
  if (isNaN(page) || page < 1) {
    page = PAGINATION.DEFAULT_PAGE;
  }

  // Parse and validate limit
  let limit = parseInt(query.limit);
  if (isNaN(limit) || limit < 1) {
    limit = PAGINATION.DEFAULT_LIMIT;
  }

  // Cap limit to prevent DoS via large result sets
  if (limit > PAGINATION.MAX_LIMIT) {
    limit = PAGINATION.MAX_LIMIT;
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

/**
 * Validates pagination parameters and returns error if invalid
 *
 * Use this middleware when you want to reject invalid pagination instead of defaulting
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Next middleware
 */
export function requireValidPagination(req, res, next) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  // Check if page is provided and invalid
  if (req.query.page && (isNaN(page) || page < 1)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Page must be a positive integer',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // Check if limit is provided and invalid
  if (req.query.limit && (isNaN(limit) || limit < 1)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Limit must be a positive integer',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // Check if limit exceeds maximum
  if (limit > PAGINATION.MAX_LIMIT) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // Attach validated pagination to request
  req.pagination = validatePagination(req.query);

  next();
}

/**
 * Formats pagination metadata for API responses
 *
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} Pagination metadata
 */
export function getPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  };
}

/**
 * Example usage in route:
 *
 * import { validatePagination, getPaginationMeta } from '../utils/pagination.js';
 *
 * router.get('/users', async (req, res) => {
 *   const { page, limit, offset } = validatePagination(req.query);
 *
 *   const users = await pool.query(
 *     'SELECT * FROM users LIMIT $1 OFFSET $2',
 *     [limit, offset]
 *   );
 *
 *   const countResult = await pool.query('SELECT COUNT(*) FROM users');
 *   const total = parseInt(countResult.rows[0].count);
 *
 *   res.json({
 *     success: true,
 *     data: users.rows,
 *     pagination: getPaginationMeta(page, limit, total)
 *   });
 * });
 */
