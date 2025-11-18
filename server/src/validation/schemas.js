/**
 * Centralized Validation Schemas using Zod
 *
 * NOTE: This requires installing Zod in the server:
 * npm install zod
 *
 * Usage:
 * import { validateCampaignInput, validateUserInput } from './validation/schemas.js'
 * const result = validateCampaignInput(req.body)
 * if (!result.success) {
 *   return res.status(400).json({ error: result.error.errors })
 * }
 */

// TODO: Install zod first: npm install zod
// Then uncomment this import:
// import { z } from 'zod'

// Placeholder - uncomment when zod is installed
const z = typeof require !== 'undefined' && (() => {
  try { return require('zod').z } catch(e) { return null }
})() || null

/**
 * User Validation Schemas
 * NOTE: These will only work after installing zod
 */
export const UserSchemas = z ? {
  // Email validation
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email debe tener al menos 5 caracteres')
    .max(255, 'Email demasiado largo')
    .toLowerCase()
    .trim(),

  // Password validation (matches backend requirements)
  password: z.string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un carácter especial'),

  // User role validation
  role: z.enum(['user', 'admin', 'superadmin'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),

  // Registration input
  register: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(12),
    role: z.enum(['user', 'admin', 'superadmin']).optional()
  }),

  // Login input
  login: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1, 'Contraseña requerida')
  }),

  // Update user input
  update: z.object({
    email: z.string().email().optional(),
    role: z.enum(['user', 'admin', 'superadmin']).optional(),
    isActive: z.boolean().optional()
  }),

  // Change password input
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12)
      .regex(/[A-Z]/, 'Debe contener mayúscula')
      .regex(/[a-z]/, 'Debe contener minúscula')
      .regex(/[0-9]/, 'Debe contener número')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener carácter especial')
  })
}

/**
 * Campaign Validation Schemas
 */
export const CampaignSchemas = {
  // URL validation with security
  url: z.string()
    .url('URL inválida')
    .regex(/^https?:\/\//, 'URL debe empezar con http:// o https://')
    .max(2048, 'URL demasiado larga'),

  // Campaign action
  action: z.object({
    text: z.string().min(1).max(50),
    url: z.string().url().regex(/^https?:\/\//).optional()
  }),

  // Create campaign input
  create: z.object({
    name: z.string().min(1, 'Nombre requerido').max(255).trim(),
    title: z.string().min(1, 'Título requerido').max(100).trim(),
    body: z.string().min(1, 'Cuerpo requerido').max(500).trim(),
    siteId: z.number().int().positive(),
    segmentId: z.number().int().positive().optional(),

    // Optional URL fields with validation
    iconUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional(),
    imageUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional(),
    clickUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional(),
    badgeUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional(),

    // Send type and scheduling
    sendType: z.enum(['immediate', 'scheduled']),
    scheduledAt: z.string().datetime().optional(),

    // Actions array
    actions: z.array(z.object({
      text: z.string().min(1).max(50),
      url: z.string().url().regex(/^https?:\/\//).optional()
    })).max(3).optional()
  }).refine(
    (data) => {
      if (data.sendType === 'scheduled' && !data.scheduledAt) {
        return false
      }
      return true
    },
    {
      message: 'scheduledAt es requerido cuando sendType es "scheduled"'
    }
  ),

  // Update campaign input
  update: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    title: z.string().min(1).max(100).trim().optional(),
    body: z.string().min(1).max(500).trim().optional(),
    iconUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional().nullable(),
    imageUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional().nullable(),
    clickUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional().nullable(),
    badgeUrl: z.string().url().regex(/^https?:\/\//).max(2048).optional().nullable(),
    sendType: z.enum(['immediate', 'scheduled']).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
    status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed']).optional()
  })
}

/**
 * Site Validation Schemas
 */
export const SiteSchemas = {
  // Domain validation
  domain: z.string()
    .min(3, 'Dominio demasiado corto')
    .max(255, 'Dominio demasiado largo')
    .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, 'Formato de dominio inválido')
    .toLowerCase()
    .trim(),

  // Create site input
  create: z.object({
    name: z.string().min(1, 'Nombre requerido').max(255).trim(),
    domain: z.string()
      .min(3).max(255)
      .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i)
      .toLowerCase().trim(),
    description: z.string().max(500).optional()
  }),

  // Update site input
  update: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    domain: z.string()
      .min(3).max(255)
      .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i)
      .toLowerCase().trim().optional(),
    description: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional()
  })
}

/**
 * Segment Validation Schemas
 */
export const SegmentSchemas = {
  // Create segment input
  create: z.object({
    name: z.string().min(1, 'Nombre requerido').max(255).trim(),
    siteId: z.number().int().positive(),
    conditions: z.record(z.any()).optional()
  }),

  // Update segment input
  update: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    conditions: z.record(z.any()).optional()
  })
}

/**
 * Query Parameters Validation
 */
export const QuerySchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  }),

  // Search
  search: z.object({
    search: z.string().max(255).trim().optional()
  }),

  // Filter by status
  status: z.object({
    status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed', 'all']).optional()
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),

  // Site ID filter
  siteId: z.object({
    siteId: z.coerce.number().int().positive().optional()
  })
}

/**
 * Helper function to validate input with Zod
 */
export function validateInput(schema, data) {
  try {
    const result = schema.safeParse(data)

    if (!result.success) {
      return {
        success: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'general', message: 'Error de validación' }]
    }
  }
}

/**
 * Express middleware for validation
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = validateInput(schema, req.body)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: result.errors
        }
      })
    }

    // Replace req.body with validated and sanitized data
    req.body = result.data
    next()
  }
}

/**
 * Express middleware for query validation
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = validateInput(schema, req.query)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parámetros de consulta inválidos',
          details: result.errors
        }
      })
    }

    // Replace req.query with validated data
    req.query = result.data
    next()
  }
}
