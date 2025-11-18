import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../constants/index.js';

/**
 * Rate Limiter Middleware
 * Protects endpoints from brute force and DoS attacks
 */

// Strict rate limit for authentication endpoints (login, refresh token)
// Prevents brute force password attacks
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS, // 15 minutes
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,   // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos de autenticación. Por favor, intenta de nuevo en 15 minutos.',
    }
  },
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false,     // Count failed requests
});

// Moderate rate limit for registration
// Prevents spam account creation
export const registerLimiter = rateLimit({
  windowMs: RATE_LIMITS.REGISTER.WINDOW_MS, // 1 hour
  max: RATE_LIMITS.REGISTER.MAX_REQUESTS,   // 3 registrations per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas cuentas creadas desde esta IP. Por favor, intenta de nuevo en 1 hora.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed registration attempts
  skipSuccessfulRequests: true,
});

// General API rate limit
// Protects against general abuse and DoS
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMITS.API_GENERAL.WINDOW_MS,   // 15 minutes
  max: RATE_LIMITS.API_GENERAL.MAX_REQUESTS,     // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas peticiones. Por favor, intenta de nuevo más tarde.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to not penalize normal users
  skipSuccessfulRequests: true,
});

// Campaign creation rate limit
// Prevents spam campaigns
export const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 campaigns per hour per user
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas campañas creadas. Por favor, intenta de nuevo en 1 hora.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit per authenticated user, not per IP
  keyGenerator: (req) => {
    return req.user?.id?.toString() || req.ip
  }
});

// Notification sending rate limit
// Prevents abuse of notification system
export const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 notifications per minute
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas notificaciones enviadas. Por favor, espera un momento.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id?.toString() || req.ip
  }
});

// Dashboard/Analytics rate limit
// Prevents excessive database queries
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas peticiones de analíticas. Por favor, espera un momento.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// File upload rate limit (if you add file uploads later)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas cargas de archivos. Por favor, intenta de nuevo en 1 hora.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Custom handler for when rate limit is exceeded
export const rateLimitHandler = (req, res) => {
  console.warn(`[Rate Limit] IP: ${req.ip} exceeded rate limit on ${req.path}`);

  res.status(429).json({
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Límite de peticiones excedido. Por favor, intenta más tarde.',
      retryAfter: res.getHeader('Retry-After')
    }
  });
};
