import { ERROR_CODES, HTTP_STATUS } from '@/constants/app'

/**
 * Error message utilities
 * Centralizes error message handling to avoid duplication
 *
 * ANTI-PATTERN FIX: Was duplicated 10+ times across components
 */

interface ApiError {
  status?: number
  code?: string
  message?: string
  error?: {
    code?: string
    message?: string
  }
}

/**
 * Gets user-friendly error message from API error
 *
 * @param error - Error object from API or caught exception
 * @returns User-friendly error message in Spanish
 *
 * @example
 * ```tsx
 * try {
 *   await loginService(credentials)
 * } catch (err) {
 *   const message = getErrorMessage(err)
 *   toast.error(message) // "No estás autenticado"
 * }
 * ```
 */
export function getErrorMessage(error: any): string {
  // Handle null/undefined
  if (!error) return 'Error desconocido'

  // If it's a string, return it
  if (typeof error === 'string') return error

  // Extract error code from various possible locations
  const errorCode = error.code || error.error?.code
  const status = error.status

  // Map error codes to Spanish messages
  if (errorCode) {
    switch (errorCode) {
      // Authentication errors
      case ERROR_CODES.TOKEN_REQUIRED:
        return 'Se requiere autenticación'
      case ERROR_CODES.TOKEN_EXPIRED:
        return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente'
      case ERROR_CODES.TOKEN_INVALID:
        return 'Token de autenticación inválido'
      case ERROR_CODES.USER_NOT_FOUND:
        return 'Usuario no encontrado'
      case ERROR_CODES.INVALID_CREDENTIALS:
        return 'Email o contraseña incorrectos'

      // Authorization errors
      case ERROR_CODES.INSUFFICIENT_PERMISSIONS:
        return 'No tienes permisos para realizar esta acción'

      // Validation errors
      case ERROR_CODES.VALIDATION_ERROR:
        return error.message || error.error?.message || 'Error de validación'

      // Resource errors
      case ERROR_CODES.NOT_FOUND:
        return 'Recurso no encontrado'

      // General errors
      case ERROR_CODES.INTERNAL_ERROR:
        return 'Error interno del servidor. Por favor, intenta nuevamente'

      default:
        // Return custom message if available
        if (error.message) return error.message
        if (error.error?.message) return error.error.message
    }
  }

  // Map HTTP status codes
  if (status) {
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return 'No estás autenticado. Por favor, inicia sesión'
      case HTTP_STATUS.FORBIDDEN:
        return 'No tienes permisos para acceder a este recurso'
      case HTTP_STATUS.NOT_FOUND:
        return 'Recurso no encontrado'
      case HTTP_STATUS.CONFLICT:
        return 'El recurso ya existe'
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        return 'Datos inválidos. Por favor, verifica tu información'
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return 'Error del servidor. Por favor, intenta nuevamente más tarde'
      default:
        if (status >= 500) {
          return 'Error del servidor. Por favor, intenta nuevamente'
        }
        if (status >= 400) {
          return 'Solicitud inválida'
        }
    }
  }

  // Fallback to error message if available
  if (error.message) return error.message
  if (error.error?.message) return error.error.message

  // Last resort
  return 'Algo salió mal. Por favor, intenta nuevamente'
}

/**
 * Gets appropriate error title based on error type
 *
 * @param error - Error object
 * @returns Error title in Spanish
 */
export function getErrorTitle(error: any): string {
  const errorCode = error?.code || error?.error?.code
  const status = error?.status

  if (errorCode === ERROR_CODES.TOKEN_EXPIRED || status === HTTP_STATUS.UNAUTHORIZED) {
    return 'Sesión expirada'
  }

  if (errorCode === ERROR_CODES.INSUFFICIENT_PERMISSIONS || status === HTTP_STATUS.FORBIDDEN) {
    return 'Acceso denegado'
  }

  if (errorCode === ERROR_CODES.NOT_FOUND || status === HTTP_STATUS.NOT_FOUND) {
    return 'No encontrado'
  }

  if (errorCode === ERROR_CODES.VALIDATION_ERROR || status === HTTP_STATUS.BAD_REQUEST) {
    return 'Error de validación'
  }

  if (status && status >= 500) {
    return 'Error del servidor'
  }

  return 'Error'
}

/**
 * Determines if error requires re-authentication
 *
 * @param error - Error object
 * @returns true if user should be redirected to login
 */
export function requiresReauth(error: any): boolean {
  const errorCode = error?.code || error?.error?.code
  const status = error?.status

  return (
    errorCode === ERROR_CODES.TOKEN_EXPIRED ||
    errorCode === ERROR_CODES.TOKEN_INVALID ||
    errorCode === ERROR_CODES.TOKEN_REQUIRED ||
    status === HTTP_STATUS.UNAUTHORIZED
  )
}

/**
 * Formats validation errors into readable list
 *
 * @param errors - Array of validation errors or error object with details
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: any): string {
  if (!errors) return 'Error de validación'

  // If it's an array of errors
  if (Array.isArray(errors)) {
    return errors.map(err => {
      if (typeof err === 'string') return err
      return err.message || err.msg || 'Error de validación'
    }).join(', ')
  }

  // If it's an object with field errors
  if (typeof errors === 'object') {
    return Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ')
  }

  return String(errors)
}
