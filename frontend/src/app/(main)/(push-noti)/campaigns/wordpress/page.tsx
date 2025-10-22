import InfoCard from "@/components/InfoCard";
export default function WordpressPage() {
    return (
        <div>
            <div>
            <InfoCard title="Wordpress Notifications" description="Web Push Notifications can be sent by our WordPress Plugin. The Plugin allows you to automatically send push notifications when you publish a new post."/>
            </div>

            <div className="bg-white rounded-lg border border-border dark:bg-[#222]">
                {/* Header */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Campaigns</h2>
                    </div>
                </div>
            </div>
        </div>
    );
}