import InfoCard from "@/components/InfoCard";

export default function Page() {
    return (
        <div>
            <div className="mb-6">
                <InfoCard
                    title="Custom Attributes"
                    description="Custom Attributes are not supported by non-HTTPS sites. This is because web push is not supported on insecure non-HTTPS sites at all. As a workaround, we simulate web push on HTTP sites by opening a popup to a subdomain of our own secure site (e.g. https://subdomain.wpush.io)."
                />
            </div>

            <div className="bg-white rounded-lg border border-border dark:bg-[#222] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Custom Attributes Management</h2>
                </div>

                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">Custom attributes configuration will be displayed here</p>
                    <p className="text-sm">Define and manage custom user attributes for segmentation and personalization</p>
                </div>
            </div>
        </div>
    );
}