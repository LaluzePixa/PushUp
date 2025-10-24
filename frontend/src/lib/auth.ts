/**
 * Secure Authentication Library
 * Client-side authentication utilities
 */

export interface Session {
    user: {
        id: number
        email: string
        role: 'user' | 'admin' | 'superadmin'
        isActive: boolean
        createdAt: string
        updatedAt?: string
    }
    expiresAt: Date
}

/**
 * Client-side authentication check
 * Uses fetch to check session status without exposing tokens
 */
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user: Session['user'] | null }> {
    try {
        const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include', // Include cookies
        })

        if (response.ok) {
            const data = await response.json()
            return {
                isAuthenticated: true,
                user: data.user
            }
        }

        return {
            isAuthenticated: false,
            user: null
        }
    } catch (error) {
        console.error('Auth check failed:', error)
        return {
            isAuthenticated: false,
            user: null
        }
    }
}