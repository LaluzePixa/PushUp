'use client'
import InfoCard from "@/components/InfoCard";
import { useState, useEffect } from "react";
import { Search, MoreHorizontal, X } from "lucide-react";
import { dashboardService, Journey } from "@/services/api";

// Importar el JourneyCreator que ya tienes
import JourneyCreator from "@/components/JourneyCreator";

export default function JourneyPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Cargar journeys desde el backend
  useEffect(() => {
    const loadJourneys = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardService.getJourneys({
          page: pagination.current,
          limit: pagination.limit,
          search: searchTerm || undefined
        });

        if (response.success && response.data) {
          setJourneys(response.data.journeys);
          setPagination(response.data.pagination);
        } else {
          setError('No se pudieron cargar los journeys');
        }
      } catch (err) {
        console.error('Error loading journeys:', err);
        setError('Error al cargar los journeys');
      } finally {
        setIsLoading(false);
      }
    };

    loadJourneys();
  }, [searchTerm, pagination.current]);

  const getStatusBadge = (status: Journey['status']) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "Draft":
        return `${baseClasses} bg-gray-100 text-gray-700`;
      case "Active":
        return `${baseClasses} bg-green-100 text-green-700`;
      case "Paused":
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case "Completed":
        return `${baseClasses} bg-blue-100 text-blue-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <InfoCard
          title="What are Journeys?"
          description="Journeys allow you to automate sending multiple push notifications over time instead of manually running push campaigns over and over. You can make Journeys highly personalized and targeted by applying our powerful segmentation rules."
        />
      </div>

      <div className="bg-white rounded-lg border border-border dark:bg-[#222]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Journeys</h2>
            <span className="text-sm text-gray-500">
              {isLoading ? 'Cargando...' : `${pagination.total} found`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search this page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowCreator(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Create New Journey
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#222]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Steps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-[#222]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Cargando journeys...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-destructive">
                      <p className="mb-2">⚠️ {error}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-primary hover:underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : journeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-muted-foreground">
                      <p className="mb-2">🎯 No hay journeys disponibles</p>
                      <p className="text-sm">Los journeys aparecerán aquí cuando se creen</p>
                    </div>
                  </td>
                </tr>
              ) : (
                journeys.map((journey) => (
                  <tr key={journey.id} className="hover:bg-gray-50 dark:hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        {journey.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                      {journey.dateCreated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(journey.status)}>
                        {journey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
                      {journey.stepsCount || 0} pasos
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Journey Creator */}
      {showCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Journey</h3>
              <button
                onClick={() => setShowCreator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-0">
              <JourneyCreator />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}