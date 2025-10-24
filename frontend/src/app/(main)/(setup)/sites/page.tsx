'use client'

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Globe, Users, BarChart3, Calendar } from 'lucide-react';
import InfoCard from '@/components/InfoCard';
import { sitesService, Site } from '@/services/api';
import { useSiteContext } from '@/contexts/SiteContext';

export default function SitesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [createSiteData, setCreateSiteData] = useState({
        name: '',
        domain: '',
        description: ''
    });

    const { sites, refreshSites, setSelectedSite } = useSiteContext();

    // Cargar sitios al montar el componente
    useEffect(() => {
        const loadSites = async () => {
            try {
                setLoading(true);
                setError(null);
                await refreshSites();
            } catch (err: unknown) {
                console.error('Error loading sites:', err);
                const errorMessage = err instanceof Error ? err.message : 'Error al cargar los sitios';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadSites();
    }, [refreshSites]);

    // Filtrar sitios por término de búsqueda
    const filteredSites = sites.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Manejar creación de sitio
    const handleCreateSite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!createSiteData.name.trim() || !createSiteData.domain.trim()) {
            alert('Nombre y dominio son requeridos');
            return;
        }

        try {
            const response = await sitesService.createSite({
                name: createSiteData.name.trim(),
                domain: createSiteData.domain.trim(),
                description: createSiteData.description.trim() || undefined
            });

            if (response.success) {
                setCreateSiteData({ name: '', domain: '', description: '' });
                setShowCreateModal(false);
                await refreshSites();
                alert('Sitio creado exitosamente');
            }
        } catch (err: unknown) {
            console.error('Error creating site:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`Error al crear el sitio: ${errorMessage}`);
        }
    };

    // Manejar edición de sitio
    const handleEditSite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSite) return;

        try {
            const response = await sitesService.updateSite(editingSite.id, {
                name: editingSite.name.trim(),
                domain: editingSite.domain.trim(),
                description: editingSite.description?.trim() || undefined,
                isActive: editingSite.isActive
            });

            if (response.success) {
                setShowEditModal(false);
                setEditingSite(null);
                await refreshSites();
                alert('Sitio actualizado exitosamente');
            }
        } catch (err: unknown) {
            console.error('Error updating site:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`Error al actualizar el sitio: ${errorMessage}`);
        }
    };

    // Manejar eliminación de sitio
    const handleDeleteSite = async (site: Site) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el sitio "${site.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await sitesService.deleteSite(site.id);
            await refreshSites();
            alert('Sitio eliminado exitosamente');
        } catch (err: unknown) {
            console.error('Error deleting site:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`Error al eliminar el sitio: ${errorMessage}`);
        }
    };

    // Formatear fecha
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="">
                <InfoCard
                    title="Gestión de Sitios"
                    description="Administra todos tus sitios web desde aquí. Puedes agregar nuevos sitios, editar la configuración existente, y ver estadísticas de suscriptores para cada sitio. Cada sitio tiene su propia configuración de notificaciones push."
                />
            </div>

            {/* Sites Management Section */}
            <div className="bg-white dark:bg-[#222] rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sitios Web</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {loading ? 'Cargando...' : `${filteredSites.length} sitio${filteredSites.length !== 1 ? 's' : ''} encontrado${filteredSites.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar sitios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar Sitio
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-6">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="p-6 text-center">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Cargando sitios...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Sites Grid */}
                        {filteredSites.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="text-muted-foreground">
                                    <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="mb-2">No hay sitios registrados</p>
                                    <p className="text-sm">Agrega tu primer sitio para comenzar a enviar notificaciones push</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                                    >
                                        Agregar Primer Sitio
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {filteredSites.map((site) => (
                                    <div
                                        key={site.id}
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        {/* Site Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                    {site.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                                                    {site.domain}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span
                                                    className={`inline-block w-3 h-3 rounded-full ${site.isActive ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                    title={site.isActive ? 'Activo' : 'Inactivo'}
                                                />
                                            </div>
                                        </div>

                                        {/* Site Description */}
                                        {site.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                                {site.description}
                                            </p>
                                        )}

                                        {/* Site Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Suscriptores</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {site.subscribersCount?.toLocaleString() || '0'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-green-500" />
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Campañas</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {site.campaignsCount?.toLocaleString() || '0'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Site Creation Date */}
                                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                            <span>Creado: {formatDate(site.createdAt)}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedSite(site)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
                                            >
                                                Seleccionar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingSite(site);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                title="Editar sitio"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSite(site)}
                                                className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                                title="Eliminar sitio"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal para crear sitio */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Agregar Nuevo Sitio
                        </h3>

                        <form onSubmit={handleCreateSite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre del Sitio *
                                </label>
                                <input
                                    type="text"
                                    value={createSiteData.name}
                                    onChange={(e) => setCreateSiteData({ ...createSiteData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Mi Sitio Web"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Dominio *
                                </label>
                                <input
                                    type="url"
                                    value={createSiteData.domain}
                                    onChange={(e) => setCreateSiteData({ ...createSiteData, domain: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://misitioweb.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={createSiteData.description}
                                    onChange={(e) => setCreateSiteData({ ...createSiteData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Descripción opcional del sitio"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateSiteData({ name: '', domain: '', description: '' });
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                                >
                                    Crear Sitio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para editar sitio */}
            {showEditModal && editingSite && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Editar Sitio
                        </h3>

                        <form onSubmit={handleEditSite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre del Sitio *
                                </label>
                                <input
                                    type="text"
                                    value={editingSite.name}
                                    onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Dominio *
                                </label>
                                <input
                                    type="url"
                                    value={editingSite.domain}
                                    onChange={(e) => setEditingSite({ ...editingSite, domain: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={editingSite.description || ''}
                                    onChange={(e) => setEditingSite({ ...editingSite, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingSite.isActive}
                                    onChange={(e) => setEditingSite({ ...editingSite, isActive: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Sitio activo
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingSite(null);
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}