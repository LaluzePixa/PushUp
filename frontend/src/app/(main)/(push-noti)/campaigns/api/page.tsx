import InfoCard from "@/components/InfoCard";
export default function ApiPage() {
    return (
        <div>
            <div>
                <InfoCard title="REST API Notifications" description="Web Push Notifications can be sent programmatically by your server via our REST API."/>
            </div>
         
            <div className="bg-white dark:bg-[#222] rounded-lg border border-border ">
                {/* Header */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log</h2>
                    </div>
                </div>
            </div>
        </div>
        
    );
}