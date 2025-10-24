'use client'

import * as React from "react"
import { useSiteContext } from "@/contexts/SiteContext"
import {
    Globe,
    Plus,
    ChevronDown,
} from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sitesService } from "@/services/api"

// Componente para selector de sitios
export function SiteSelector() {
    const { selectedSite, setSelectedSite, sites, loading, refreshSites } = useSiteContext();
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [newSiteData, setNewSiteData] = React.useState({
        name: '',
        domain: '',
        description: ''
    });
    const [isCreating, setIsCreating] = React.useState(false);

    // Crear nuevo sitio
    const handleCreateSite = async () => {
        if (!newSiteData.name.trim() || !newSiteData.domain.trim()) {
            alert('El nombre y dominio son obligatorios');
            return;
        }

        // Validación básica de dominio
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!domainRegex.test(newSiteData.domain.trim())) {
            alert('El formato del dominio no es válido. Ejemplo: ejemplo.com');
            return;
        }

        // Verificar si ya existe un sitio con el mismo dominio
        const domainExists = sites.some(site =>
            site.domain.toLowerCase() === newSiteData.domain.trim().toLowerCase()
        );

        if (domainExists) {
            alert('Ya tienes un sitio registrado con este dominio');
            return;
        }

        try {
            setIsCreating(true);
            const response = await sitesService.createSite(newSiteData);

            if (response.success && response.data) {
                await refreshSites(); // Refrescar la lista desde el contexto
                setSelectedSite(response.data);
                setIsCreateModalOpen(false);
                setNewSiteData({ name: '', domain: '', description: '' });

                // Mostrar mensaje de éxito
                alert(`¡Sitio "${response.data.name}" creado exitosamente!`);
            }
        } catch (error: unknown) {
            console.error('Error creating site:', error);

            // Mostrar mensaje de error específico al usuario
            let errorMessage = 'Error al crear el sitio';

            if (error && typeof error === 'object') {
                const apiError = error as { status?: number; code?: string; details?: string[]; message?: string };

                if (apiError.status === 409 || apiError.code === 'DOMAIN_EXISTS') {
                    errorMessage = 'Ya tienes un sitio registrado con este dominio. Usa un dominio diferente.';
                } else if (apiError.status === 403 || apiError.code === 'SITES_LIMIT_EXCEEDED') {
                    errorMessage = 'Has alcanzado el límite máximo de sitios permitidos (5 sitios).';
                } else if (apiError.status === 400 || apiError.code === 'VALIDATION_ERROR') {
                    if (apiError.details && Array.isArray(apiError.details)) {
                        errorMessage = `Datos inválidos: ${apiError.details.join(', ')}`;
                    } else {
                        errorMessage = 'Los datos del sitio no son válidos. Verifica el formato del dominio.';
                    }
                } else if (apiError.message) {
                    errorMessage = apiError.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            // TODO: Implementar toast/notification system
            alert(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full">
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={`w-full justify-between h-auto p-3 font-bold text-xl hover:bg-transparent ${!selectedSite ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Globe className={`h-5 w-5 flex-shrink-0 ${!selectedSite ? 'text-yellow-600 dark:text-yellow-400' : ''
                                    }`} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className={`font-bold text-xl truncate ${!selectedSite ? 'text-yellow-800 dark:text-yellow-200' : ''
                                        }`}>
                                        {selectedSite?.name || '⚠️ Seleccionar sitio'}
                                    </div>
                                    {!selectedSite && (
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                            Haz clic para elegir un sitio
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-64" align="start">
                        <DropdownMenuLabel>Mis Sitios</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {sites.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <div className="text-sm">No tienes sitios</div>
                                <div className="text-xs">Crea uno para comenzar</div>
                            </div>
                        ) : (
                            sites.map((site) => (
                                <DropdownMenuItem
                                    key={site.id}
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setSelectedSite(site);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <Globe className="h-4 w-4" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{site.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {site.domain}
                                            </div>
                                        </div>
                                        {selectedSite?.id === site.id && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="cursor-pointer text-blue-600"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Añadir nuevo sitio</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Modal para crear nuevo sitio */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Sitio</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="site-name">Nombre del sitio</Label>
                            <Input
                                id="site-name"
                                value={newSiteData.name}
                                onChange={(e) => setNewSiteData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Mi sitio web"
                            />
                        </div>

                        <div>
                            <Label htmlFor="site-domain">Dominio</Label>
                            <Input
                                id="site-domain"
                                value={newSiteData.domain}
                                onChange={(e) => setNewSiteData(prev => ({ ...prev, domain: e.target.value }))}
                                placeholder="ejemplo.com"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Sin https:// (ejemplo: ejemplo.com). Debe ser único.
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="site-description">Descripción (opcional)</Label>
                            <Input
                                id="site-description"
                                value={newSiteData.description}
                                onChange={(e) => setNewSiteData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descripción del sitio web"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                            disabled={isCreating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateSite}
                            disabled={isCreating || !newSiteData.name.trim() || !newSiteData.domain.trim()}
                        >
                            {isCreating ? 'Creando...' : 'Crear Sitio'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}