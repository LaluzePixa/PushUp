import InfoCard from "@/components/InfoCard";
export default function Page() {
    return (
        <div>
            <div>
                <InfoCard title="Custom Attributes" description="Custom Attributes are not supported by non-HTTPS sites. This is because web push is not supported on insecure non-HTTPS sites at all. As a workaround, we simulate web push on HTTP sites by opening a popup to a subdomain of our own secure site (e.g. https://subdomain.wpush.io)."/>
            </div>

            <div className="bg-white rounded-lg border border-border dark:bg-[#222]">
                {/* Header */}
                <div className="p-6 ">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Users</h2>
                    </div>
                </div>
            </div>
    
        </div>
    );
        
}