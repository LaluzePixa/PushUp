import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth-server'

/**
 * Logout API route
 * Clears server-side session cookie
 */
export async function POST() {
    try {
        await deleteSession()

        return NextResponse.json(
            { message: 'Logged out successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        )
    }
}