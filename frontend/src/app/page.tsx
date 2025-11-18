"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) {
      return // Esperar a que termine de cargar
    }

    if (isAuthenticated) {
      console.log('✅ Usuario autenticado, redirigiendo a select-site')
      router.replace('/select-site')
    } else {
      console.log('❌ Usuario no autenticado, redirigiendo a login')
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-300">
          {loading ? 'Verificando autenticación...' : 'Redirigiendo...'}
        </p>
      </div>
    </div>
  )
}