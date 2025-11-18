'use client'

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSiteContext } from '@/contexts/SiteContext';
import { CleanSiteSelector } from '@/components/CleanSiteSelector';

interface SiteGuardProps {
    children: React.ReactNode;
}

export const SiteGuard: React.FC<SiteGuardProps> = ({ children }) => {
    const { selectedSite, sites, loading } = useSiteContext();
    const pathname = usePathname();
    const router = useRouter();

    // Rutas que no requieren selección de sitio
    const noSiteRequiredPaths = ['/setup/sites'];
    const shouldBypassSiteGuard = noSiteRequiredPaths.some(path => pathname === path);

    console.log('🔍 SiteGuard render:', {
        pathname,
        selectedSite: selectedSite?.name,
        sitesLength: sites.length,
        loading,
        shouldBypassSiteGuard
    });

    // Efecto para redirigir a /setup/sites si no hay sitios y no estamos ya allí
    useEffect(() => {
        if (!loading && sites.length === 0 && !shouldBypassSiteGuard) {
            console.log('➕ No hay sitios, redirigiendo a /setup/sites para crear el primero');
            router.replace('/setup/sites');
        }
    }, [loading, sites.length, shouldBypassSiteGuard, router]);

    // Mostrar loading mientras se cargan los sitios
    if (loading) {
        console.log('⏳ Mostrando loading...');
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-300">Cargando tus sitios...</p>
                </div>
            </div>
        );
    }

    // Si no hay sitios y no estamos en la ruta de bypass, mostrar loading mientras redirige
    if (sites.length === 0 && !shouldBypassSiteGuard) {
        console.log('⏳ No hay sitios, esperando redirección...');
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-300">Redirigiendo...</p>
                </div>
            </div>
        );
    }

    // Si estamos en la ruta de bypass (setup/sites), permitir acceso
    if (shouldBypassSiteGuard) {
        console.log('🚪 Ruta de bypass, mostrando contenido sin verificar sitio');
        return <>{children}</>;
    }

    // Si no hay sitio seleccionado, mostrar selector
    // KEY: Forzar remount limpio para evitar errores de HMR con lucide-react
    if (!selectedSite) {
        console.log('🎯 Mostrando CleanSiteSelector (usuario tiene sitios pero no ha seleccionado)');
        return <CleanSiteSelector key={`site-selector-${sites.length}`} />;
    }

    // Mostrar contenido una vez seleccionado el sitio
    // KEY: Usar site id para forzar remount completo cuando cambia el sitio (evita errores HMR)
    console.log('📱 Mostrando dashboard con sidebar');
    return <div key={`dashboard-${selectedSite.id}`}>{children}</div>;
};