import InfoCard from "@/components/InfoCard";

export default function TroubleshooterPage() {
    return (
        <div>
            <div className="mb-6">
                <InfoCard
                    title="Troubleshooter"
                    description="Diagnose and resolve common issues with push notifications. Run automated tests to verify your setup and identify configuration problems."
                />
            </div>

            <div className="bg-white rounded-lg border border-border dark:bg-[#222] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Diagnostic Tools</h2>
                </div>

                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">Troubleshooting tools coming soon</p>
                    <p className="text-sm">Run diagnostics to test notification delivery, service worker status, and configuration</p>
                </div>
            </div>
        </div>
    );
}