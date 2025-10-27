'use client'
import InfoCard from "@/components/InfoCard";

/**
 * Journey Builder (Automation) Page
 * Temporarily disabled - will be re-enabled soon
 * Date: 2025-10-24
 */
export default function JourneyPage() {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <InfoCard
          title="What are Journeys?"
          description="Journeys allow you to automate sending multiple push notifications over time instead of manually running push campaigns over and over. You can make Journeys highly personalized and targeted by applying our powerful segmentation rules."
        />
      </div>

      {/* Temporarily Disabled Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-3">
            Feature Under Maintenance
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            The Journey Builder (Automation) section is temporarily disabled.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            This feature will be re-enabled soon. Please use other available options in the meantime.
          </p>
        </div>
      </div>
    </div>
  );
}