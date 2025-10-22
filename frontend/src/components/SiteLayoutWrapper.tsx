'use client'

import { useSiteContext } from '@/contexts/SiteContext';
import SidebarLayout from '@/components/sidebar';

interface SiteLayoutWrapperProps {
    children: React.ReactNode;
}

export const SiteLayoutWrapper: React.FC<SiteLayoutWrapperProps> = ({ children }) => {
    const { selectedSite, loading } = useSiteContext();

    // Si está cargando, no mostrar nada (el SiteGuard maneja el loading)
    if (loading) {
        return null;
    }

    // Si hay sitio seleccionado, mostrar con sidebar
    if (selectedSite) {
        return (
            <SidebarLayout>
                <main className="h-full overflow-auto p-4">
                    {children}
                </main>
            </SidebarLayout>
        );
    }

    // Si no hay sitio seleccionado, no mostrar sidebar (el SiteGuard mostrará el selector)
    return <>{children}</>;
};