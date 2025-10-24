/**
 * Enhanced Type Definitions
 * Stricter typing for better developer experience and runtime safety
 */

// Base types
export type UserRole = 'user' | 'admin' | 'superadmin'
export type CampaignStatus = 'Error' | 'Success' | 'Pending' | 'Scheduled'
export type JourneyStatus = 'Draft' | 'Active' | 'Paused' | 'Completed'

// API Response wrapper with better error typing
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
        details?: string[]
    }
    pagination?: PaginationMeta
}

// Pagination metadata
export interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

// Enhanced User interface with validation
export interface User {
    readonly id: number
    email: string
    role: UserRole
    isActive: boolean
    createdAt: string
    updatedAt?: string
}

// Site interface with computed fields
export interface Site {
    readonly id: number
    name: string
    domain: string
    description?: string
    isActive: boolean
    subscribersCount: number
    campaignsCount: number
    createdAt: string
    updatedAt: string
    // Computed properties
    readonly displayName: string
    readonly isConfigured: boolean
}

// Navigation item type with better structure
export interface NavigationItem {
    readonly id: string
    title: string
    url?: string
    icon?: React.ComponentType<{ className?: string }>
    badge?: {
        text: string
        variant: 'default' | 'success' | 'warning' | 'error'
    }
    isCollapsible?: boolean
    items?: NavigationItem[]
    permissions?: UserRole[]
    onClick?: () => void
}

// Form validation types
export interface ValidationError {
    field: string
    message: string
    code: string
}

export interface FormState<T = Record<string, unknown>> {
    data: T
    errors: ValidationError[]
    isSubmitting: boolean
    isValid: boolean
}

// API Error types with specific codes
export type ApiErrorCode =
    | 'VALIDATION_ERROR'
    | 'AUTHENTICATION_ERROR'
    | 'AUTHORIZATION_ERROR'
    | 'RESOURCE_NOT_FOUND'
    | 'RESOURCE_CONFLICT'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INTERNAL_SERVER_ERROR'

export interface ApiError extends Error {
    readonly code: ApiErrorCode
    readonly status: number
    readonly details?: Record<string, unknown>
    readonly timestamp: string
}

// Session and Authentication types
export interface SessionData {
    user: User
    expiresAt: Date
    permissions: string[]
    metadata?: Record<string, unknown>
}

export interface AuthState {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    permissions: string[]
}

// Component props with better typing
export interface BaseComponentProps {
    className?: string
    'data-testid'?: string
}

export interface LayoutProps extends BaseComponentProps {
    children: React.ReactNode
}

// Query and filter types for better API calls
export interface BaseQueryOptions {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface SiteQueryOptions extends BaseQueryOptions {
    isActive?: boolean
    userId?: number
}

export interface UserQueryOptions extends BaseQueryOptions {
    role?: UserRole
    isActive?: boolean
}

// Event handler types
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>
export type SyncEventHandler<T = Event> = (event: T) => void

// Utility types for better inference
export type NonEmptyArray<T> = [T, ...T[]]
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonly<U>[]
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
}

// Route types for type-safe navigation
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    CAMPAIGNS: '/campaigns',
    SEGMENTS: '/segments',
    SUBSCRIBERS: '/subscribers',
    SITES: '/sites',
    ANALYTICS: '/dashboard/analytics',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = typeof ROUTES[RouteKey]

// Environment types
export interface EnvironmentConfig {
    readonly NODE_ENV: 'development' | 'production' | 'test'
    readonly API_URL: string
    readonly APP_URL: string
    readonly ENABLE_ANALYTICS: boolean
    readonly ENABLE_DEBUG: boolean
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
    mode: ThemeMode
    primaryColor: string
    accentColor: string
}

// Export utility functions for type checking
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export const isUserRole = (role: string): role is UserRole => {
    return ['user', 'admin', 'superadmin'].includes(role)
}

// Type guards
export const isApiError = (error: unknown): error is ApiError => {
    return (
        error instanceof Error &&
        'code' in error &&
        'status' in error &&
        typeof (error as ApiError).code === 'string' &&
        typeof (error as ApiError).status === 'number'
    )
}

export const hasPermission = (user: User | null, permission: string): boolean => {
    if (!user) return false

    // Super admin has all permissions
    if (user.role === 'superadmin') return true

    // Admin has most permissions except super admin specific ones
    if (user.role === 'admin') {
        return !permission.startsWith('superadmin.')
    }

    // Regular users have limited permissions
    return permission.startsWith('user.')
}