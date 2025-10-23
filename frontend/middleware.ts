// middleware.ts - Protección de rutas autenticadas
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  console.log('🚀 MIDDLEWARE:', url.pathname)

  // Lista de rutas públicas que NO requieren autenticación
  const publicPaths = ['/login', '/register']

  // Si es una ruta pública, permitir acceso
  if (publicPaths.includes(url.pathname)) {
    console.log('🌍 Ruta pública, acceso permitido')
    return NextResponse.next()
  }

  // Si es una ruta privada, verificar autenticación
  console.log('🔒 Verificando autenticación...')

  // Buscar la cookie de autenticación
  const authToken = request.cookies.get('auth-token')?.value

  console.log('🍪 Token presente:', !!authToken)

  // Si no hay token, redirigir al login
  if (!authToken) {
    console.log('❌ No autenticado, redirigiendo al login')
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  console.log('✅ Acceso permitido')
  return NextResponse.next()
}

export const config = {
  // Proteger todas las rutas EXCEPTO:
  // - /login y /register (rutas públicas)
  // - /_next (archivos estáticos de Next.js)
  // - /api (rutas de API)
  // - Archivos estáticos (imágenes, fuentes, etc.)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login|register).*)',
  ]
}
