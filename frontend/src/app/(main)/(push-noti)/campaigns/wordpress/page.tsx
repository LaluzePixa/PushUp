/*
 * ⚠️ SECCIÓN TEMPORALMENTE DESHABILITADA ⚠️
 * Esta sección de Push Notifications via WordPress Plugin está comentada temporalmente
 * Fecha: 2025-10-24
 * No borrar - se reactivará próximamente
 */

import InfoCard from "@/components/InfoCard";

export default function WordpressPage() {
    return (
        <div className="space-y-6">
            <div>
                <InfoCard
                    title="Wordpress Notifications"
                    description="Web Push Notifications can be sent by our WordPress Plugin. The Plugin allows you to automatically send push notifications when you publish a new post."
                />
            </div>

            {/* ⚠️ FUNCIONALIDAD TEMPORALMENTE DESHABILITADA */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-8">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-3">
                        Funcionalidad en Mantenimiento
                    </h2>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        La sección de Push Notifications via WordPress Plugin está temporalmente deshabilitada.
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Esta función se reactivará próximamente. Por favor, utiliza las otras opciones disponibles.
                    </p>
                </div>
            </div>

            {/* CÓDIGO ORIGINAL COMENTADO - NO BORRAR
            <div className="bg-white rounded-lg border border-border dark:bg-[#222]">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Campaigns</h2>
                    </div>
                </div>
            </div>
            */}
        </div>
    );
}