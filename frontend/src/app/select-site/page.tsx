'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSiteContext } from '@/contexts/SiteContext';

/**
 * Site Selection Page - Smart Redirect
 *
 * Esta página detecta si hay sitios disponibles:
 * - Si NO hay sitios → redirige a /sites para crear el primero
 * - Si hay sitios → redirige al dashboard (SiteGuard manejará el selector)
 */
export default function SelectSitePage() {
  const router = useRouter();
  const { sites, loading } = useSiteContext();

  useEffect(() => {
    if (loading) {
      console.log('⏳ SelectSitePage - Cargando sitios...');
      return;
    }

    if (sites.length === 0) {
      console.log('➕ SelectSitePage - No hay sitios, redirigiendo a /sites para crear uno');
      router.replace('/sites');
    } else {
      console.log('📱 SelectSitePage - Hay sitios disponibles, redirigiendo a dashboard');
      router.replace('/dashboard');
    }
  }, [sites, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  );
}
