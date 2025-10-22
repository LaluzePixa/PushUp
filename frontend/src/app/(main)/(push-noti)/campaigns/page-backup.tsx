'use client'
import InfoCard from "@/components/InfoCard";
import { useState, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, Info } from "lucide-react";
import { campaignsService, Campaign } from "@/services/api";
import CreateCampaignModal from "@/components/CreateCampaignModal";

type SortField = 'name' | 'dateCreated' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Campaigns() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>('dateCreated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    // Cargar campañas desde el backend
    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await campaignsService.getCampaigns({
                    page: pagination.current,
                    limit: pagination.limit,
                    search: searchTerm || undefined
                });

                if (response.success && response.data) {
                    setCampaigns(response.data.campaigns);
                    setPagination(response.data.pagination);
                } else {
                    setError('No se pudieron cargar las campañas');
                }
            } catch (err) {
                console.error('Error loading campaigns:', err);
                setError('Error al cargar las campañas');
            } finally {
                setIsLoading(false);
            }
        };

        loadCampaigns();
    }, [searchTerm, pagination.current]);

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[id^="dropdown-"]') && !target.closest('button')) {
                document.querySelectorAll('[id^="dropdown-"]').forEach(dropdown => {
                    dropdown.classList.add('hidden');
                });
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Función para recargar campañas después de crear una nueva
    const handleCampaignCreated = () => {
        // Recargar la primera página para ver la nueva campaña
        setPagination(prev => ({ ...prev, current: 1 }));
        // El useEffect se disparará automáticamente por el cambio en pagination.current
    };

    // Función para enviar una campaña en borrador
    const handleSendCampaign = async (campaignId: string) => {
        if (!confirm('¿Estás seguro de que quieres enviar esta campaña?')) {
            return;
        }

        try {
            const response = await campaignsService.sendCampaign(campaignId);
            if (response.success) {
                alert(`Campaña enviada exitosamente. ${response.data?.sent || 0} notificaciones enviadas.`);
                // Recargar campañas
                handleCampaignCreated();
            } else {
                alert('Error al enviar la campaña');
            }
        } catch (error: any) {
            console.error('Error sending campaign:', error);
            alert(`Error al enviar la campaña: ${error.message || 'Error desconocido'}`);
        }
    };

    // Función para eliminar una campaña
    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await campaignsService.deleteCampaign(campaignId);
            alert('Campaña eliminada exitosamente');
            // Recargar campañas
            handleCampaignCreated();
        } catch (error: any) {
            console.error('Error deleting campaign:', error);
            alert(`Error al eliminar la campaña: ${error.message || 'Error desconocido'}`);
        }
    };

    // Función para editar una campaña (navegar a página de edición)
    const handleEditCampaign = (campaignId: string) => {
        // Por ahora solo mostrar mensaje, luego implementar navegación
        alert(`Funcionalidad de edición para campaña ${campaignId} pendiente de implementar`);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Ordenar campañas localmente después de obtenerlas del backend
    const sortedCampaigns = [...campaigns].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'dateCreated':
                aValue = new Date(a.dateCreated).getTime();
                bValue = new Date(b.dateCreated).getTime();
                break;
            case 'status':
                aValue = a.status.toLowerCase();
                bValue = b.status.toLowerCase();
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const getStatusBadge = (status: Campaign['status']) => {
        const baseClasses = "px-2 py-1 rounded text-xs font-medium";
        switch (status) {
            case "Error":
                return `${baseClasses} bg-red-100 text-red-800`;
            case "Success":
                return `${baseClasses} bg-green-100 text-green-800`;
            case "Pending":
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case "Scheduled":
                return `${baseClasses} bg-blue-100 text-blue-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
        ) : (
            <ChevronDown className="h-4 w-4" />
        );
    };

    return (
        <div className="space-y-8">
            <div className="">
                <InfoCard
                    title="Manual Push"
                    description="You can create a campaign below to send a manual push notification to your users. Campaigns can be sent instantly or scheduled to be sent at a later date. You can also see detailed analytics on each campaign after it has been sent to your users. Note: We only store last 60 days of history for push sent via Dashboard"
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Campaigns
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {campaigns.length} Campaigns found
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search this page..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                Create New Campaign
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full" style={{ position: 'relative' }}>
                        <thead className="bg-gray-50 dark:bg-[#222] ">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        Name
                                        <SortIcon field="name" />
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('dateCreated')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        Date Created
                                        <SortIcon field="dateCreated" />
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        Status
                                        <SortIcon field="status" />
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        Total Attempts
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        Successfully Sent
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        Failed to Send
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        Delivered
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        Clicked
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        Closed
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        CTR
                                        <Info className="h-4 w-4 text-gray-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-[#222]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            <span className="ml-2 text-sm text-muted-foreground">Cargando campañas...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-8 text-center">
                                        <div className="text-destructive">
                                            <p className="mb-2">⚠️ {error}</p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedCampaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-8 text-center">
                                        <div className="text-muted-foreground">
                                            <p className="mb-2">📢 No hay campañas disponibles</p>
                                            <p className="text-sm">Las campañas aparecerán aquí cuando se creen</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedCampaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-accent">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {campaign.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                                            {campaign.dateCreated}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={getStatusBadge(campaign.status)}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.totalAttempts || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.successfullySent || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.failedToSend}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.delivered || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.clicked || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.closed || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {campaign.ctr ? `${campaign.ctr}%` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const dropdown = document.getElementById(`dropdown-${campaign.id}`);
                                                        const button = e.currentTarget;
                                                        const rect = button.getBoundingClientRect();

                                                        // Cerrar otros dropdowns abiertos
                                                        document.querySelectorAll('[id^="dropdown-"]').forEach(d => {
                                                            if (d.id !== `dropdown-${campaign.id}`) {
                                                                d.classList.add('hidden');
                                                            }
                                                        });

                                                        if (dropdown) {
                                                            dropdown.classList.toggle('hidden');
                                                            if (!dropdown.classList.contains('hidden')) {
                                                                dropdown.style.position = 'fixed';
                                                                dropdown.style.top = `${rect.bottom + 5}px`;
                                                                dropdown.style.right = `${window.innerWidth - rect.right}px`;
                                                                dropdown.style.left = 'auto';
                                                            }
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent rounded-full hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                                                    title="Opciones"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>

                                                <div
                                                    id={`dropdown-${campaign.id}`}
                                                    className="hidden w-48 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-[#1f1f1f] dark:border-gray-600"
                                                    style={{
                                                        position: 'fixed',
                                                        zIndex: 9999
                                                    }}
                                                >
                                                    <div className="py-1">
                                                        {/* Enviar - solo para borradores */}
                                                        {campaign.status === 'Pending' && (
                                                            <button
                                                                onClick={() => {
                                                                    handleSendCampaign(campaign.id);
                                                                    document.getElementById(`dropdown-${campaign.id}`)?.classList.add('hidden');
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/10"
                                                            >
                                                                <span className="mr-3">📤</span>
                                                                Enviar campaña
                                                            </button>
                                                        )}

                                                        {/* Editar - para borradores y programadas */}
                                                        {(campaign.status === 'Pending' || campaign.status === 'Scheduled') && (
                                                            <button
                                                                onClick={() => {
                                                                    handleEditCampaign(campaign.id);
                                                                    document.getElementById(`dropdown-${campaign.id}`)?.classList.add('hidden');
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                            >
                                                                <span className="mr-3">✏️</span>
                                                                Editar campaña
                                                            </button>
                                                        )}

                                                        {/* Eliminar - para todas las campañas */}
                                                        <button
                                                            onClick={() => {
                                                                handleDeleteCampaign(campaign.id);
                                                                document.getElementById(`dropdown-${campaign.id}`)?.classList.add('hidden');
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 border-t border-gray-200 dark:border-gray-600"
                                                        >
                                                            <span className="mr-3">🗑️</span>
                                                            Eliminar campaña
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para crear campaña */}
            <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCampaignCreated}
            />
        </div>
    );
}