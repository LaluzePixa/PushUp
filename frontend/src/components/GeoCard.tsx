'use client'

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { useSiteContext } from '@/contexts/SiteContext';
import { dashboardService } from '@/services/dashboard.service';

interface GeoCardProps {
    type: 'countries' | 'states' | 'cities' | 'active_users';
    className?: string;
}

interface GeoData {
    countries: Array<{ name: string; count: number }>;
    states: Array<{ name: string; count: number }>;
    cities: Array<{ name: string; count: number }>;
    activeUsers: number;
}

export const GeoCard: React.FC<GeoCardProps> = ({ type, className = "" }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<GeoData | null>(null);
    const { selectedSite } = useSiteContext();

    const getTitle = () => {
        switch (type) {
            case 'countries':
                return 'Top 10 Countries';
            case 'states':
                return 'Top 10 States';
            case 'cities':
                return 'Top 10 Cities';
            case 'active_users':
                return 'Total Active Users';
            default:
                return '';
        }
    };

    const getIcon = () => {
        return <Info className="w-4 h-4 text-muted-foreground" />;
    };

    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await dashboardService.getGeoReport(selectedSite?.id);

                if (response.success && response.data) {
                    setData(response.data);
                } else {
                    setError('Error al cargar datos geográficos');
                }
            } catch (err) {
                console.error('Error fetching geo data:', err);
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        fetchGeoData();
    }, [selectedSite?.id]);

    // Estado de carga
    if (loading) {
        return (
            <div className={`bg-card text-card-foreground rounded-lg border border-border p-6 ${className}`}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
                    {getIcon()}
                </div>
                <div className="flex items-center justify-center min-h-[250px]">
                    <div className="text-center">
                        <div className="h-6 w-24 bg-muted rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar contenido según el tipo
    const renderContent = () => {
        if (!data) {
            return (
                <div className="flex items-center justify-center min-h-[250px]">
                    <div className="text-center text-muted-foreground">
                        <p className="text-base mb-2">You do not have any users yet.</p>
                        <p className="text-sm">
                            Make sure you have successfully integrated Webpushr to your site.
                        </p>
                    </div>
                </div>
            );
        }

        if (type === 'active_users') {
            return (
                <div className="flex items-center justify-center min-h-[250px]">
                    {data.activeUsers > 0 ? (
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">
                                {data.activeUsers.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <p className="text-base mb-2">You do not have any users yet.</p>
                            <p className="text-sm">
                                Make sure you have successfully integrated Webpushr to your site.
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        // Para countries, states, cities
        const listData = type === 'countries' ? data.countries :
            type === 'states' ? data.states :
                data.cities;

        if (listData.length === 0) {
            return (
                <div className="flex items-center justify-center min-h-[250px]">
                    <div className="text-center text-muted-foreground">
                        <p className="text-base mb-2">You do not have any users yet.</p>
                        <p className="text-sm">
                            Make sure you have successfully integrated Webpushr to your site.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-[250px]">
                <div className="space-y-2">
                    {listData.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground w-6">
                                    {index + 1}.
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                                {item.count.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={`bg-card text-card-foreground rounded-lg border border-border p-6 hover:shadow-md transition-shadow ${className}`}>
            {/* Header con título e ícono */}
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-medium text-foreground">{getTitle()}</h3>
                {getIcon()}
            </div>

            {/* Contenido */}
            {error ? (
                <div className="flex items-center justify-center min-h-[250px]">
                    <div className="text-center">
                        <div className="text-destructive font-medium mb-2">⚠️ Error</div>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </div>
            ) : (
                renderContent()
            )}
        </div>
    );
};
