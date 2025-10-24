'use client'

import React, { useState, memo } from 'react';
import { Globe, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSiteContext } from '@/contexts/SiteContext';
import { Site } from '@/services/api';

interface SiteItemProps {
    site: Site;
    onSelect: (site: Site) => void;
    isSelected: boolean;
}

// Memoize SiteItem to prevent unnecessary re-renders
const SiteItem = memo<SiteItemProps>(({ site, onSelect, isSelected }) => {
    return (
        <div
            className={`cursor-pointer p-3 rounded-md border transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
            onClick={() => onSelect(site)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                        <div className="font-medium text-sm">{site.name}</div>
                        <div className="text-xs text-gray-500">{site.domain}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-sm font-medium">{site.subscribersCount || 0}</div>
                        <div className="text-xs text-gray-500">subs</div>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">C</div>
                        <div className="w-4 h-4 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">F</div>
                        <div className="w-4 h-4 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">S</div>
                        <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">E</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Add display name for better debugging
SiteItem.displayName = 'SiteItem';

const CleanSiteSelectorComponent: React.FC = () => {
    const { sites, selectedSite, setSelectedSite, createSite, loading } = useSiteContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        description: ''
    });

    const handleCreate = async () => {
        if (!formData.name.trim() || !formData.domain.trim()) return;

        setIsCreating(true);
        try {
            await createSite(formData);
            setIsModalOpen(false);
            setFormData({ name: '', domain: '', description: '' });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Simple Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Globe className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="font-semibold text-gray-900 dark:text-white">PushSaaS</h1>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Nuevo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                {sites.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe className="w-8 h-8 text-gray-500" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Sin sitios</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Crea tu primer sitio para empezar.</p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear sitio
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Sitios ({sites.length})</h2>
                        </div>
                        <div className="space-y-2">
                            {sites.map((site) => (
                                <SiteItem
                                    key={site.id}
                                    site={site}
                                    onSelect={setSelectedSite}
                                    isSelected={selectedSite?.id === site.id}
                                />
                            ))}
                        </div>
                        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-800 dark:text-blue-200">Compatible con navegadores modernos</span>
                                <div className="flex gap-1">
                                    <div className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">C</div>
                                    <div className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">F</div>
                                    <div className="w-5 h-5 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">S</div>
                                    <div className="w-5 h-5 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">E</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Sitio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nombre</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Mi sitio"
                            />
                        </div>
                        <div>
                            <Label>Dominio</Label>
                            <Input
                                value={formData.domain}
                                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                                placeholder="ejemplo.com"
                            />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !formData.name || !formData.domain}
                        >
                            {isCreating ? 'Creando...' : 'Crear'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Memoize the main component to prevent re-renders when parent updates
CleanSiteSelectorComponent.displayName = 'CleanSiteSelector';
export const CleanSiteSelector = memo(CleanSiteSelectorComponent);