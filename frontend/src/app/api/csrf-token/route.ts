import { NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'

/**
 * CSRF Token API route
 * Generates and returns a CSRF token for form protection
 */
export async function GET() {
    try {
        const token = await generateCSRFToken()

        return NextResponse.json({ token })
    } catch (error) {
        console.error('CSRF token generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate CSRF token' },
            { status: 500 }
        )
    }
}