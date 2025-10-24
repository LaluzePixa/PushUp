/**
 * CSRF Protection Utility
 * Provides CSRF token generation and validation for forms
 */

import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

/**
 * Generates a CSRF token and sets it in an HTTP-only cookie
 */
export async function generateCSRFToken(): Promise<string> {
    const token = randomBytes(32).toString('hex')
    const cookieStore = await cookies()

    cookieStore.set('csrf-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    })

    return token
}

/**
 * Validates CSRF token from request headers against cookie
 */
export async function validateCSRFToken(headerToken: string | null): Promise<boolean> {
    if (!headerToken) {
        return false
    }

    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('csrf-token')?.value

    if (!cookieToken) {
        return false
    }

    return headerToken === cookieToken
}

/**
 * Client-side function to get CSRF token for forms
 */
export async function getCSRFToken(): Promise<string | null> {
    try {
        const response = await fetch('/api/csrf-token', {
            method: 'GET',
            credentials: 'include',
        })

        if (response.ok) {
            const data = await response.json()
            return data.token
        }

        return null
    } catch (error) {
        console.error('Failed to get CSRF token:', error)
        return null
    }
}