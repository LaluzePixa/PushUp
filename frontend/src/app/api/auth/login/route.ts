import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth-server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Login API route
 * Handles authentication with backend server and creates HTTP-only session cookie
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            )
        }

        // Call backend server login endpoint
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Error de autenticación', code: data.code },
                { status: response.status }
            )
        }

        // Create session with HTTP-only cookie
        if (data.user && data.token) {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

            await createSession({
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.role,
                    isActive: data.user.isActive,
                    createdAt: data.user.createdAt,
                    updatedAt: data.user.updatedAt,
                },
                expiresAt,
            })

            return NextResponse.json({
                message: 'Login exitoso',
                user: data.user,
                token: data.token, // También devolver el token para uso en cliente
            })
        }

        return NextResponse.json(
            { error: 'Error de autenticación' },
            { status: 401 }
        )
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
