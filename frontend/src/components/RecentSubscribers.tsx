'use client'

import React, { useEffect, useState } from 'react';
import { useSiteContext } from '@/contexts/SiteContext';
import { dashboardService, Subscription } from '@/services/api';

export const RecentSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSite } = useSiteContext();

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dashboardService.getSubscriptions(
          10,
          1,
          selectedSite?.id
        );

        if (response.success && response.data) {
          setSubscribers(response.data);
        } else {
          setError('Error al cargar suscriptores');
        }
      } catch (err) {
        console.error('Error fetching subscribers:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [selectedSite?.id]);

  // Estado de carga
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Subscribers</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-4 w-48 bg-muted rounded"></div>
              <div className="h-4 w-24 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado de error o sin datos
  if (error || subscribers.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Subscribers</h3>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            View All →
          </button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>{error || 'No subscribers found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Subscribers</h3>
        <button
          onClick={() => window.location.href = '/subscribers'}
          className="text-sm text-primary hover:underline"
        >
          View All →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Date/Time
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Country
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                OS
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Browser
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Device
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => {
              const date = new Date(subscriber.date);
              const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit'
              });
              const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });

              return (
                <tr key={subscriber.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-2 text-sm">
                    <div>{formattedDate}</div>
                    <div className="text-xs text-muted-foreground">{formattedTime}</div>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {subscriber.country || '-'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {subscriber.os || 'Unknown'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {subscriber.browser || 'Unknown'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    {subscriber.device || 'Unknown'}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <button className="text-primary hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
