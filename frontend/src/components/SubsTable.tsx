"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { dashboardService, Subscription } from '@/services/api';
import { useSiteContext } from '@/contexts/SiteContext';

// Componente para la tabla de suscriptores
export default function RecentSubscribersTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSite } = useSiteContext();

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardService.getSubscriptions(10, 1, selectedSite?.id);

      if (response.success && response.data) {
        setSubscriptions(response.data);
      } else {
        setError('Error al cargar suscripciones');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [selectedSite?.id]); // Dependencia agregada

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suscriptores Recientes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sitio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                SO
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Navegador
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Dispositivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Cargando suscripciones...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="text-destructive">
                    <p className="mb-2">⚠️ {error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm text-primary hover:underline"
                    >
                      Reintentar
                    </button>
                  </div>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <p className="mb-2">📝 No hay suscripciones aún</p>
                  <p className="text-sm">Las suscripciones aparecerán aquí cuando los usuarios se suscriban</p>
                </td>
              </tr>
            ) : (
              subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(subscription.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <div>
                      <div className="font-medium">{subscription.siteName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{subscription.siteDomain}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {subscription.os}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {subscription.browser}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription.device === 'Mobile'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : subscription.device === 'Tablet'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                      {subscription.device}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {subscription.ipAddress}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="text-blue-500 dark:text-blue-400 text-sm hover:underline">
          Ver Todas
        </button>
      </div>
    </div>
  );
}

