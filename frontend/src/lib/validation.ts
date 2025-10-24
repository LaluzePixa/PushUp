/**
 * Validation Utilities
 * Centralized validation logic with TypeScript support
 */

import { z } from 'zod'

// Schema definitions using Zod for runtime validation
export const UserSchema = z.object({
    id: z.number().positive(),
    email: z.string().email(),
    role: z.enum(['user', 'admin', 'superadmin']),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
})

export const SiteSchema = z.object({
    id: z.number().positive(),
    name: z.string().min(1).max(100),
    domain: z.string().regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain format'),
    description: z.string().max(500).optional(),
    isActive: z.boolean(),
    subscribersCount: z.number().nonnegative(),
    campaignsCount: z.number().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const LoginCredentialsSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const RegisterDataSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export const SiteCreateSchema = z.object({
    name: z.string().min(1, 'Site name is required').max(100, 'Site name too long'),
    domain: z.string()
        .min(1, 'Domain is required')
        .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain format'),
    description: z.string().max(500, 'Description too long').optional(),
})

// Type inference from schemas
export type ValidatedUser = z.infer<typeof UserSchema>
export type ValidatedSite = z.infer<typeof SiteSchema>
export type ValidatedLoginCredentials = z.infer<typeof LoginCredentialsSchema>
export type ValidatedRegisterData = z.infer<typeof RegisterDataSchema>
export type ValidatedSiteCreate = z.infer<typeof SiteCreateSchema>

// Validation result type
export interface ValidationResult<T> {
    success: boolean
    data?: T
    errors?: {
        field: string
        message: string
    }[]
}

// Validation functions
export const validateUser = (data: unknown): ValidationResult<ValidatedUser> => {
    try {
        const validated = UserSchema.parse(data)
        return { success: true, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map((err: z.ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        }
    }
}

export const validateSite = (data: unknown): ValidationResult<ValidatedSite> => {
    try {
        const validated = SiteSchema.parse(data)
        return { success: true, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map((err: z.ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        }
    }
}

export const validateLoginCredentials = (data: unknown): ValidationResult<ValidatedLoginCredentials> => {
    try {
        const validated = LoginCredentialsSchema.parse(data)
        return { success: true, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map((err: z.ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        }
    }
}

export const validateRegisterData = (data: unknown): ValidationResult<ValidatedRegisterData> => {
    try {
        const validated = RegisterDataSchema.parse(data)
        return { success: true, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map((err: z.ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        }
    }
}

export const validateSiteCreate = (data: unknown): ValidationResult<ValidatedSiteCreate> => {
    try {
        const validated = SiteCreateSchema.parse(data)
        return { success: true, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map((err: z.ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }]
        }
    }
}

// Utility function to sanitize input
export const sanitizeString = (input: string): string => {
    return input.trim().replace(/[<>]/g, '')
}

// Utility function to validate environment variables
export const validateEnvironment = () => {
    const requiredEnvVars = [
        'NEXT_PUBLIC_API_URL',
        'NEXT_PUBLIC_APP_URL'
    ]

    const missing = requiredEnvVars.filter(varName => !process.env[varName])

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
}
