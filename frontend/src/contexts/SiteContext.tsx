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
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await sitesService.getSites();
      if (response.data?.sites) {
        setSites(response.data.sites);
        // NO auto-seleccionar ningún sitio - el usuario debe elegir siempre
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
        // Auto-select the newly created site
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
    setSelectedSite,
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