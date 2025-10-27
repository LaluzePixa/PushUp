import InfoCard from "@/components/InfoCard";

export default function Page() {
    return (
        <div>
            <div className="mb-6">
                <InfoCard
                    title="Opt-in Funnel Analytics"
                    description="Track and analyze your opt-in funnel performance. Monitor conversion rates, identify drop-off points, and optimize your subscription flow."
                />
            </div>

            <div className="bg-white rounded-lg border border-border dark:bg-[#222] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Funnel Overview</h2>
                </div>

                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">Opt-in funnel analytics coming soon</p>
                    <p className="text-sm">Visualize your subscription funnel with conversion metrics and insights</p>
                </div>
            </div>
        </div>
    );
}