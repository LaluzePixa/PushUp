import InfoCard from "@/components/InfoCard";

export default function Page() {
    return (
        <div>
            <div className="mb-6">
                <InfoCard
                    title="Active Users"
                    description="Monitor real-time and historical active user data. Track user engagement, session duration, and activity patterns across your site."
                />
            </div>

            <div className="bg-white rounded-lg border border-border dark:bg-[#222] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Users Overview</h2>
                </div>

                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">Active users tracking will be displayed here</p>
                    <p className="text-sm">Data includes current active users, daily/weekly/monthly active users, and engagement metrics</p>
                </div>
            </div>
        </div>
    );
}