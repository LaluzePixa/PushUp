'use client'

import { useAuth } from '@/contexts/AuthContext'
import Chart from "@/components/Chart"
import InfoCard from "@/components/InfoCard"
import MetricCard from "@/components/MetricCard"
import { MetricsGrid } from "@/components/MetricsGrid"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando...</span>
        </div>
      </div>
    )
  }

  // El dashboard ya está protegido por el middleware
  // Si el usuario llegó aquí, es porque está autenticado
  // No necesitamos hacer verificaciones manuales adicionales

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <InfoCard
            title="Welcome to Dashboard"
            description={user?.email ? `Logged in as: ${user.email}` : ""}
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
