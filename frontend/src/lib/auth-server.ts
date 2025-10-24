/**
 * Server-side Authentication Utilities
 * Server Component and API Route utilities
 */

import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Session } from '@/lib/auth'

/**
 * Creates a new session with HTTP-only cookie
 * Server-side only function
 */
export async function createSession(sessionData: Session) {
    const cookieStore = await cookies()

    // Encrypt session data (you should implement proper encryption)
    const sessionString = JSON.stringify(sessionData)

    cookieStore.set('session', sessionString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: sessionData.expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

/**
 * Retrieves current session
 * Server-side only function
 */
export async function getSession(): Promise<Session | null> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
        return null
    }

    try {
        const session = JSON.parse(sessionCookie.value) as Session

        // Check if session is expired
        if (new Date() > new Date(session.expiresAt)) {
            await deleteSession()
            return null
        }

        return session
    } catch (error) {
        console.error('Invalid session cookie:', error)
        await deleteSession()
        return null
    }
}

/**
 * Deletes the current session
 * Server-side only function
 */
export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}

/**
 * Verifies if user is authenticated
 * Redirects to login if not authenticated
 */
export async function verifySession() {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    return session
}

/**
 * Verifies if user has admin role
 * Redirects to dashboard if not admin
 */
export async function verifyAdmin() {
    const session = await verifySession()

    if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
        redirect('/dashboard')
    }

    return session
}