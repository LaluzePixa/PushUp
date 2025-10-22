'use client'
import InfoCard from "@/components/InfoCard";

export default function Page() {
    const userCount = 0;

    const handleExportCSV = () => {
        console.log("Exporting users as CSV...");
        // Aquí iría la lógica para exportar CSV
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <InfoCard 
                    title="Subscribed Users" 
                    description="Subscribed Users are website visitors who have approved (opted in) to receive communication from you via email or text/SMS."
                />
            </div>

            <div className="bg-white dark:bg-[#222] rounded-lg border border-border">
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Subscribed Users
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                {userCount} Users found
                            </span>
                            <button 
                                onClick={handleExportCSV}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Export as CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                <div className="p-12 text-center">
                    <p className="text-gray-500 text-lg">
                        No subscriber found.
                    </p>
                </div>
            </div>
        </div>
    );
}