'use client'
import InfoCard from "@/components/InfoCard";
import CreateSegmentModal from "@/components/CreateSegmentModal";
import { useState, useEffect, useCallback } from "react";
import { segmentsService, Segment, tokenUtils } from "@/services/api";
import { useSiteContext } from "@/contexts/SiteContext";

export default function SegmentsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { selectedSite } = useSiteContext();
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });

    // Cargar segmentos
    const loadSegments = useCallback(async (page = 1, search = "") => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Cargando segmentos para sitio:', selectedSite?.name, { page, search });

            const response = await segmentsService.list({
                page,
                limit: 10,
                search: search || undefined,
                siteId: selectedSite?.id // Filtrar por sitio seleccionado
            });

            console.log('✅ Respuesta de segments:', response);

            if (response.data?.segments && response.data?.pagination) {
                setSegments(response.data.segments);
                setPagination(response.data.pagination);
            } else {
                console.error('❌ Formato de respuesta inesperado:', response);
                setError('Error al cargar segmentos - formato de respuesta inválido');
            }
        } catch (err: unknown) {
            console.error('❌ Error loading segments:', err);

            // Proporcionar más detalles del error
            let errorMessage = 'Error al conectar con el servidor';

            if (err && typeof err === 'object' && 'status' in err) {
                const apiError = err as { status: number; message?: string };
                if (apiError.status === 401) {
                    errorMessage = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
                } else if (apiError.status === 403) {
                    errorMessage = 'No tienes permisos para ver los segmentos.';
                } else if (apiError.status === 404) {
                    errorMessage = 'No se encontraron segmentos.';
                } else if (apiError.message) {
                    errorMessage = apiError.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [selectedSite?.id, selectedSite?.name]);

    // Efecto para cargar segmentos cuando cambie el sitio seleccionado
    useEffect(() => {
        if (selectedSite) {
            loadSegments();
        }
    }, [selectedSite, loadSegments]);

    // Efecto para cargar segmentos al montar el componente
    useEffect(() => {
        // Verificar autenticación
        const token = tokenUtils.get();
        console.log('🔑 Token encontrado:', token ? 'Sí' : 'No', token?.substring(0, 20) + '...');

        if (!token) {
            setError('No hay token de autenticación. Por favor, inicia sesión.');
            setLoading(false);
            return;
        }

        // Solo cargar si ya hay un sitio seleccionado
        if (selectedSite) {
            loadSegments();
        }
    }, [loadSegments, selectedSite]);

    // Efecto para búsqueda con debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== "") {
                loadSegments(1, searchTerm);
            } else {
                loadSegments(1);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, loadSegments]);

    // Manejar eliminación de segmento
    const handleDeleteSegment = async (segmentId: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este segmento?')) {
            return;
        }

        try {
            await segmentsService.delete(segmentId);
            // Recargar la lista
            loadSegments(pagination.page, searchTerm);
        } catch (err) {
            console.error('Error deleting segment:', err);
            setError('Error al eliminar el segmento');
        }
    };

    // Formatear fecha
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="space-y-8">
            {/* Header Section with InfoCard */}
            <div className="">
                <InfoCard
                    title="Segments"
                    description="Segments let you divide your total users into specific audience groups based on a variety of attributes such as their page visit activity, location, device type, custom attributes, etc. Segments enable you to send highly targeted notifications that maximize engagement & ultimately coversion. Example: send a push notification to only US based visitors who have previously visited a specific page on your site during the last 1 month."
                />
            </div>

            {/* Site Context Info */}
            {selectedSite && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Viendo segmentos para: {selectedSite.name}
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Dominio: {selectedSite.domain} • Solo se muestran segmentos de este sitio
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Segments Section */}
            <div className="bg-white dark:bg-[#222] rounded-lg border border-red">
                {/* Section Header */}
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Segments</h2>
                    <span className="text-sm text-gray-500">
                        {loading ? 'Cargando...' : `${pagination.total} Segments found`}
                    </span>
                </div>

                {/* Search and Create Section */}
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <div className="flex-1 max-w-sm">
                        <input
                            type="text"
                            placeholder="Search segments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Create New Segment
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-6">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={() => loadSegments()}
                                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">Cargando segmentos...</p>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border ">
                            <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
                                <tr className="">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Segment ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Date Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border ">
                                {segments.map((segment, index) => (
                                    <tr key={segment.id} className={index % 2 === 0 ? 'bg-white dark:bg-[#222]' : 'bg-gray-50 dark:bg-[#222] '}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {segment.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {formatDate(segment.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                                    {segment.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {segment.description || 'Sin descripción'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteSegment(segment.id)}
                                                className="text-red-600 hover:text-red-900 ml-2"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && segments.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-sm">No segments found.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Create Your First Segment
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
                        </div>
                        <div className="flex space-x-2">
                            <button
                                disabled={!pagination.hasPrev}
                                onClick={() => loadSegments(pagination.page - 1, searchTerm)}
                                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={!pagination.hasNext}
                                onClick={() => loadSegments(pagination.page + 1, searchTerm)}
                                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Segment Modal */}
            <CreateSegmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    // Recargar la lista después de crear
                    loadSegments(pagination.page, searchTerm);
                }}
            />
        </div>
    );
}