'use client'

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { DashboardMetric, dashboardService } from '@/services/api';

interface MetricCardProps {
  metricName: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ metricName, className = "" }) => {
  const [metric, setMetric] = useState<DashboardMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetric = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dashboardService.getMetrics();

        if (response.success && response.data) {
          const foundMetric = response.data[metricName.toLowerCase()];
          if (foundMetric) {
            setMetric(foundMetric);
          } else {
            setError(`Métrica "${metricName}" no encontrada`);
          }
        } else {
          setError('Error al cargar métricas');
        }
      } catch (err) {
        console.error('Error fetching metric:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchMetric();
  }, [metricName]);

  // Estado de carga
  if (loading) {
    return (
      <div className={`bg-card text-card-foreground rounded-lg border border-border p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          <Info className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="h-3 w-32 bg-muted rounded animate-pulse mb-4"></div>
        <div className="flex items-center justify-center min-h-[120px]">
          <div className="text-center">
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !metric) {
    return (
      <div className={`bg-card rounded-lg border border-destructive/20 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-destructive font-medium mb-2">
            ⚠️ Error
          </div>
          <p className="text-sm text-muted-foreground">
            {error || `Métrica "${metricName}" no encontrada`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card text-card-foreground rounded-lg border border-border p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header con título e ícono de info */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-foreground">{metric.title}</h3>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Descripción */}
      <p className="text-xs text-muted-foreground mb-4">{metric.description}</p>

      {/* Contenido principal */}
      <div className="flex items-center justify-center min-h-[120px]">
        {metric.hasData ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {typeof metric.data === 'number'
                ? metric.data.toLocaleString()
                : metric.data
              }
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Data available
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="text-primary mb-2 font-medium">No data found</div>
            <div className="text-xs text-muted-foreground">
              No data available for this period
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;