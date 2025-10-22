'use client'

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { dashboardService, MonitoringLocation } from "@/services/api";

export default function UptimeMonitoringPage() {
  const [locations, setLocations] = useState<MonitoringLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [considerDownAfter, setConsiderDownAfter] = useState("5");

  // Cargar ubicaciones desde el backend
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardService.getMonitoringLocations();

        if (response.success && response.data) {
          setLocations(response.data.locations);
        } else {
          setError('No se pudieron cargar las ubicaciones');
        }
      } catch (err) {
        console.error('Error loading monitoring locations:', err);
        setError('Error al cargar las ubicaciones de monitoreo');
      } finally {
        setIsLoading(false);
      }
    };

    loadLocations();
  }, []);

  const toggleLocation = (id: string) => {
    setLocations(locations.map(location =>
      location.id === id
        ? { ...location, enabled: !location.enabled }
        : location
    ));
  };

  const LocationCard = ({ location }: { location: MonitoringLocation }) => (
    <div className="bg-white rounded-lg border border-border p-6 dark:bg-[#222]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{location.name}</h3>
          <Info className="h-4 w-4 text-gray-400" />
        </div>
        <span className={`px-3 py-1 rounded text-sm font-medium ${location.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
          }`}>
          {location.isActive ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Región: {location.region}
        </p>
        {location.lastCheckAt && (
          <p className="text-xs text-gray-400 mt-1">
            Última verificación: {new Date(location.lastCheckAt).toLocaleString('es-ES')}
          </p>
        )}
      </div>

      <div className="flex items-center">
        <button
          onClick={() => toggleLocation(location.id)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${location.enabled
              ? 'bg-blue-600'
              : 'bg-gray-200'
            }`}
          disabled={!location.isActive}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${location.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
          {location.enabled ? 'Habilitado' : 'Deshabilitado'}
        </span>
      </div>
    </div>
  );

  const ConsiderDownAfterCard = () => (
    <div className="bg-white rounded-lg border border-border p-6 dark:bg-[#222]">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Consider Down After</h3>
        <Info className="h-4 w-4 text-gray-400" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={considerDownAfter}
          onChange={(e) => setConsiderDownAfter(e.target.value)}
          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="1"
          max="60"
        />
        <span className="text-gray-600">minutes</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Uptime Monitoring</h1>
        <p className="text-gray-600">
          Monitor your website&apos;s uptime from multiple locations around the world.
        </p>
      </div>

      {/* Monitoring Locations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-6 dark:bg-[#222] animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 mb-2">⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-red-600 hover:underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
          <ConsiderDownAfterCard />
        </div>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-blue-800">
            Uptime monitoring is not active at this time. It will automatically turn on once you have at least 5 active subscribers per day on a rolling basis.
          </p>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="mt-8 bg-white rounded-lg border border-border p-6 dark:bg-[#222]">
        <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Monitoring Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
              Check Interval
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="1">Every 1 minute</option>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
              <option value="30">Every 30 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
              Notification Method
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="push">Push Notification</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        <button className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-white rounded-md hover:bg-gray-50 transition-colors">
          Reset to Default
        </button>
        <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}