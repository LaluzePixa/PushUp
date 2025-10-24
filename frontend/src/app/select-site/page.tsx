'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSiteContext } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { sitesService, Site } from '@/services/api';

export default function SelectSitePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sites, selectedSite, setSelectedSite, loading: sitesLoading, refreshSites } = useSiteContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSiteData, setNewSiteData] = useState({
    name: '',
    domain: '',
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Redirigir si ya hay un sitio seleccionado
  useEffect(() => {
    if (!authLoading && !sitesLoading && selectedSite) {
      router.push('/dashboard');
    }
  }, [selectedSite, authLoading, sitesLoading, router]);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
    router.push('/dashboard');
  };

  const handleCreateSite = async () => {
    if (!newSiteData.name.trim() || !newSiteData.domain.trim()) {
      setError('El nombre y dominio son obligatorios');
      return;
    }

    // Validación básica de dominio
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(newSiteData.domain.trim())) {
      setError('El formato del dominio no es válido. Ejemplo: ejemplo.com');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const response = await sitesService.createSite(newSiteData);

      if (response.success && response.data) {
        await refreshSites();
        setSelectedSite(response.data);
        setIsCreateModalOpen(false);
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error creating site:', error);

      if (error && typeof error === 'object') {
        const apiError = error as { status?: number; code?: string; message?: string };
        if (apiError.status === 409 || apiError.code === 'DOMAIN_EXISTS') {
          setError('Ya tienes un sitio registrado con este dominio.');
        } else if (apiError.status === 403 || apiError.code === 'SITES_LIMIT_EXCEEDED') {
          setError('Has alcanzado el límite máximo de sitios permitidos (5 sitios).');
        } else if (apiError.status === 400 || apiError.code === 'VALIDATION_ERROR') {
          setError('Los datos del sitio no son válidos. Verifica el formato del dominio.');
        } else {
          setError(apiError.message || 'Error al crear el sitio');
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al crear el sitio');
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || sitesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Selecciona tu sitio
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Elige un sitio para comenzar o crea uno nuevo
          </p>
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleSelectSite(site)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Globe className="h-10 w-10 text-blue-600 mb-2" />
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <CardTitle className="text-lg">{site.name}</CardTitle>
                <CardDescription className="text-sm truncate">
                  {site.domain}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{site.subscribersCount || 0} suscriptores</span>
                  <span>{site.campaignsCount || 0} campañas</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Site Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center min-h-[200px]"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <CardContent className="text-center p-6">
              <Plus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Crear nuevo sitio
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Añade un nuevo sitio web
              </p>
            </CardContent>
          </Card>
        </div>

        {sites.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No tienes sitios todavía
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Crea tu primer sitio para comenzar a enviar notificaciones push
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear mi primer sitio
            </Button>
          </div>
        )}

        {/* Create Site Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Sitio</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="site-name">Nombre del sitio *</Label>
                <Input
                  id="site-name"
                  value={newSiteData.name}
                  onChange={(e) => setNewSiteData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mi sitio web"
                  disabled={isCreating}
                />
              </div>

              <div>
                <Label htmlFor="site-domain">Dominio *</Label>
                <Input
                  id="site-domain"
                  value={newSiteData.domain}
                  onChange={(e) => setNewSiteData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="ejemplo.com"
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sin https:// (ejemplo: ejemplo.com)
                </p>
              </div>

              <div>
                <Label htmlFor="site-description">Descripción (opcional)</Label>
                <Input
                  id="site-description"
                  value={newSiteData.description}
                  onChange={(e) => setNewSiteData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del sitio web"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setError('');
                  setNewSiteData({ name: '', domain: '', description: '' });
                }}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSite}
                disabled={isCreating || !newSiteData.name.trim() || !newSiteData.domain.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Sitio'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
