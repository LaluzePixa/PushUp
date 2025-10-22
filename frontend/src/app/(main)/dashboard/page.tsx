'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Chart from "@/components/Chart"
import InfoCard from "@/components/InfoCard"
import MetricCard from "@/components/MetricCard"
import { MetricsGrid } from "@/components/MetricsGrid"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Marcar como montado para evitar problemas de hidratación
    setMounted(true)

    const checkAuth = () => {
      console.log('🔍 Verificando autenticación del lado del cliente...')

      // Verificar múltiples fuentes de autenticación
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      const localStorageToken = localStorage.getItem('auth-token')
      const userEmail = localStorage.getItem('user-email') || ''

      console.log('🍪 Cookie token:', !!cookieToken)
      console.log('💾 LocalStorage token:', !!localStorageToken)

      const hasValidAuth = cookieToken || localStorageToken

      if (hasValidAuth) {
        console.log('✅ Usuario autenticado')
        setIsAuthenticated(true)
        setUserEmail(userEmail)
      } else {
        console.log('❌ Usuario no autenticado - redirigiendo')
        setIsAuthenticated(false)
        // Redirigir con la URL actual como parámetro
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      }
    }

    // Solo verificar autenticación cuando esté montado
    if (mounted) {
      checkAuth()

      // También verificar cuando cambie el focus de la ventana (por si las cookies cambian)
      window.addEventListener('focus', checkAuth)

      return () => {
        window.removeEventListener('focus', checkAuth)
      }
    }
  }, [router, mounted])

  // Mostrar loading mientras verifica
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verificando autenticación...</span>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar mensaje (el redirect ya se hizo)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Acceso denegado
          </h2>
          <p className="text-gray-500">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    )
  }

  // Tu diseño original pero con botón de logout agregado
  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <div>
          <InfoCard
            title="Welcome to Dashboard"
            description={userEmail ? `Logged in as: ${userEmail}` : ""}
          />
        </div>
      </div>

      <div>
        {/* Métricas principales */}
        <MetricsGrid
          metrics={['active_users', 'total_subscriptions', 'total_campaigns', 'conversion_rate']}
          className="mb-8"
          columns={4}
          color={{ light: "#3b82f6", dark: "#1e40af" }}
        />
      </div>

      <div>
        {/* Métricas secundarias */}
        <MetricsGrid
          metrics={['total_sites', 'active_sites', 'recent_campaigns']}
          className="mb-8"
          columns={3}
          color={{ light: "#10b981", dark: "#047857" }}
        />
      </div>

      <div>
        <Chart />
      </div>

      <div>
        <MetricCard metricName="total_users" />
      </div>
    </div>
  )
}