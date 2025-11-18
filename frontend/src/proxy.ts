import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Proxy para proteger rutas
 * Verifica la sesión antes de permitir acceso a rutas protegidas
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Rutas públicas que no requieren autenticación
    const publicPaths = ['/login', '/register']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Obtener la cookie de sesión
    const sessionCookie = request.cookies.get('session')
    const hasSession = !!sessionCookie

    console.log('🔒 Proxy:', {
        pathname,
        hasSession,
        isPublicPath
    })

    // Si es una ruta pública, permitir acceso
    if (isPublicPath) {
        // Si ya tiene sesión y trata de acceder a login/register, redirigir al dashboard
        if (hasSession) {
            console.log('✅ Usuario autenticado intentando acceder a login/register, redirigiendo...')
            return NextResponse.redirect(new URL('/select-site', request.url))
        }
        return NextResponse.next()
    }

    // Para rutas protegidas, verificar sesión
    if (!hasSession) {
        console.log('❌ No hay sesión, redirigiendo a login')
        const loginUrl = new URL('/login', request.url)
        // Guardar la URL a la que intentaba acceder para redirigir después del login
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Validar que la sesión es válida (no expirada)
    try {
        const session = JSON.parse(sessionCookie.value)
        const expiresAt = new Date(session.expiresAt)
        const now = new Date()

        if (now > expiresAt) {
            console.log('❌ Sesión expirada, redirigiendo a login')
            const response = NextResponse.redirect(new URL('/login', request.url))
            // Eliminar cookie expirada
            response.cookies.delete('session')
            return response
        }
    } catch (error) {
        console.error('❌ Error al validar sesión:', error)
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('session')
        return response
    }

    console.log('✅ Sesión válida, permitiendo acceso')
    return NextResponse.next()
}

/**
 * Configuración del middleware
 * Define qué rutas deben pasar por el middleware
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
    ],
}
