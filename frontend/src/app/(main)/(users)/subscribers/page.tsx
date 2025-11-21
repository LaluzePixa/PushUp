'use client'
import Tables from "@/components/Table";
import InfoCard from "@/components/InfoCard";
import { useSiteContext } from '@/contexts/SiteContext';

export default function Page() {
    const { selectedSite } = useSiteContext();

    return (
        <div className="space-y-8">
            {/* Header Section with InfoCard */}
            <div className="">
                <InfoCard
                    title="Subscribers"
                    description="Subscribers are the users who have subscribed to your push notifications. You can see detailed information about each subscriber including their location, device, and browser information."
                />
            </div>

            {!selectedSite && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                Selecciona un sitio web
                            </h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Por favor, selecciona un sitio web desde el selector en la parte superior para ver sus suscriptores
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscribers Section */}
            <div className="dark:bg-[#222] border border-border rounded-lg p-6">
                <Tables />
            </div>
        </div>
    );
}