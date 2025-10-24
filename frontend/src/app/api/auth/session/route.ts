import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'

/**
 * Session check API route
 * Returns current user session without exposing tokens
 */
export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            user: session.user,
            expiresAt: session.expiresAt
        })
    } catch (error) {
        console.error('Session check error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}