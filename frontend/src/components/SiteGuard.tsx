'use client'

import { useSiteContext } from '@/contexts/SiteContext';
import { CleanSiteSelector } from '@/components/CleanSiteSelector';

interface SiteGuardProps {
    children: React.ReactNode;
}

export const SiteGuard: React.FC<SiteGuardProps> = ({ children }) => {
    const { selectedSite, sites, loading } = useSiteContext();

    // Derive the value instead of using state - this avoids setState in effect
    const shouldShowSelector = !selectedSite;

    console.log('🔍 SiteGuard render:', {
        selectedSite: selectedSite?.name,
        sitesLength: sites.length,
        loading,
        shouldShowSelector
    });

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

    // Mostrar selector si no hay sitio seleccionado
    // KEY: Forzar remount limpio para evitar errores de HMR con lucide-react
    if (shouldShowSelector) {
        console.log('🎯 Mostrando CleanSiteSelector');
        return <CleanSiteSelector key={`site-selector-${sites.length}`} />;
    }

    // Mostrar contenido una vez seleccionado el sitio
    // KEY: Usar site id para forzar remount completo cuando cambia el sitio (evita errores HMR)
    console.log('📱 Mostrando dashboard con sidebar');
    return <div key={`dashboard-${selectedSite?.id || 'none'}`}>{children}</div>;
};