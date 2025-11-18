'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Site Selection Page - Simple Redirect to Dashboard
 *
 * Esta página simplemente redirige al dashboard.
 * El SiteGuard dentro de (main) se encargará de:
 * 1. Verificar si hay sitio en localStorage
 * 2. Mostrar el selector si no hay sitio seleccionado
 * 3. Mostrar el dashboard si hay sitio seleccionado
 */
export default function SelectSitePage() {
  const router = useRouter();

  useEffect(() => {
    console.log('� SelectSitePage - Redirigiendo a dashboard (SiteGuard manejará la lógica)');
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  );
}
