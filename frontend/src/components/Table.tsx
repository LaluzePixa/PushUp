"use client"

import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { dashboardService, Subscription } from "@/services/api";

export default function Tables() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await dashboardService.getSubscriptions(20, 1);

                if (response.success && response.data) {
                    setSubscriptions(response.data);
                } else {
                    setError('Error al cargar suscriptores');
                }
            } catch (err) {
                console.error('Error fetching subscriptions:', err);
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptions();
    }, []);

    // Función para formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    return (
        <Table className="dark:bg-[#222]">
            <TableHeader>
                <TableRow>
                    <TableHead className="">Sitio</TableHead>
                    <TableHead>Dominio</TableHead>
                    <TableHead className="">País</TableHead>
                    <TableHead className="">Dispositivo</TableHead>
                    <TableHead className="">Navegador</TableHead>
                    <TableHead className="">Fecha</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="ml-2">Cargando suscriptores...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                            <div className="text-red-500">
                                <p className="mb-2">❌ {error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Reintentar
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : subscriptions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <p className="mb-2">� No hay suscriptores registrados</p>
                            <p className="text-sm">Los suscriptores aparecerán aquí cuando se suscriban a las notificaciones</p>
                        </TableCell>
                    </TableRow>
                ) : (
                    subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                            <TableCell className="font-medium">{subscription.siteName}</TableCell>
                            <TableCell>{subscription.siteDomain}</TableCell>
                            <TableCell>{subscription.country || 'N/A'}</TableCell>
                            <TableCell>{subscription.device || 'N/A'}</TableCell>
                            <TableCell>{subscription.browser || 'N/A'}</TableCell>
                            <TableCell>
                                {new Date(subscription.date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}