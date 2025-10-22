// middleware.ts - VERSIÓN SÚPER SIMPLE
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  console.log('🚀 MIDDLEWARE:', url.pathname)
  
  // Solo verificar si la ruta empieza con /dashboard
  if (url.pathname.startsWith('/dashboard')) {
    console.log('🔒 Verificando dashboard...')
    
    // Buscar la cookie de autenticación
    const authToken = request.cookies.get('auth-token')?.value
    
    console.log('🍪 Token presente:', !!authToken)
    
    // Si no hay token, redirigir al login
    if (!authToken) {
      console.log('❌ Redirigiendo al login')
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    
    console.log('✅ Acceso permitido')
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*'
}