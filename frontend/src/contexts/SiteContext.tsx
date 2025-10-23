'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Site, sitesService } from '@/services/api';

interface SiteContextType {
  selectedSite: Site | null;
  setSelectedSite: (site: Site | null) => void;
  sites: Site[];
  loading: boolean;
  refreshSites: () => Promise<void>;
  createSite: (siteData: { name: string; domain: string; description?: string }) => Promise<void>;
}

// React 19 requires an argument even if undefined
const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const useSiteContext = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  return context;
};

interface SiteProviderProps {
  children: ReactNode;
}

export const SiteProvider = ({ children }: SiteProviderProps) => {
  const [selectedSite, setSelectedSiteState] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Wrapper para setSelectedSite que persiste en localStorage
   * Esto permite que la selección sobreviva a recargas de página
   */
  const setSelectedSite = (site: Site | null) => {
    setSelectedSiteState(site);

    if (typeof window !== 'undefined') {
      if (site) {
        // Guardar el ID del sitio seleccionado
        localStorage.setItem('selectedSiteId', site.id.toString());
        console.log('✅ Sitio seleccionado guardado:', site.name);
      } else {
        // Limpiar si se deselecciona
        localStorage.removeItem('selectedSiteId');
        console.log('🗑️ Selección de sitio limpiada');
      }
    }
  };

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await sitesService.getSites();
      if (response.data?.sites) {
        setSites(response.data.sites);

        // Intentar restaurar el sitio seleccionado desde localStorage
        if (typeof window !== 'undefined') {
          const savedSiteId = localStorage.getItem('selectedSiteId');
          if (savedSiteId) {
            const savedSite = response.data.sites.find(
              (s: Site) => s.id.toString() === savedSiteId
            );
            if (savedSite) {
              console.log('🔄 Restaurando sitio seleccionado:', savedSite.name);
              setSelectedSiteState(savedSite);
            } else {
              console.log('⚠️ Sitio guardado no encontrado, limpiando localStorage');
              localStorage.removeItem('selectedSiteId');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSites = async () => {
    await loadSites();
  };

  const createSite = async (siteData: { name: string; domain: string; description?: string }) => {
    try {
      setLoading(true);
      const response = await sitesService.createSite(siteData);
      if (response.success && response.data) {
        // Refresh the sites list to include the new site
        await refreshSites();
        // Auto-select the newly created site (también lo guarda en localStorage)
        setSelectedSite(response.data);
      }
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const value: SiteContextType = {
    selectedSite,
    setSelectedSite,  // Ahora usa el wrapper con persistencia
    sites,
    loading,
    refreshSites,
    createSite
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};
