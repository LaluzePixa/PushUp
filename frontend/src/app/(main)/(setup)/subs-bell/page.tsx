'use client';
import { useState, useEffect } from "react";
import { dashboardService, RecentCampaign } from "@/services/api";
import { useSiteContext } from "@/contexts/SiteContext";

export default function SubscriptionPage() {
  // Styling options state
  const [style, setStyle] = useState("Rounded");
  const [position, setPosition] = useState("Bottom Left");
  const [theme, setTheme] = useState("Dark");
  const [themeColor, setThemeColor] = useState("#4A90E2");
  const [popupStyle, setPopupStyle] = useState("Standard");
  const [xAxis, setXAxis] = useState("15");
  const [yAxis, setYAxis] = useState("15");

  // Action button configuration state
  const [defaultTitle, setDefaultTitle] = useState("Subscribe to receive push notifications on latest updates");
  const [defaultButtonText, setDefaultButtonText] = useState("SUBSCRIBE");
  const [subscribedTitle, setSubscribedTitle] = useState("You are subscribed to Push Notifications");
  const [subscribedButtonText, setSubscribedButtonText] = useState("UNSUBSCRIBE");
  const [unsubscribedTitle, setUnsubscribedTitle] = useState("You are unsubscribed to Push Notifications");
  const [unsubscribedButtonText, setUnsubscribedButtonText] = useState("SUBSCRIBE");

  // Show last 3 notifications state
  const [showLastNotifications, setShowLastNotifications] = useState(true);

  // Heading state
  const [defaultHeading, setDefaultHeading] = useState("Here are some notifications you missed:");
  const [subscribedHeading, setSubscribedHeading] = useState("Recent Notifications");

  // Preview state
  const [previewTab, setPreviewTab] = useState("Default");

  // Real notifications data state
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSite } = useSiteContext();

  // Load real campaigns data
  useEffect(() => {
    const loadRecentCampaigns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await dashboardService.getRecentCampaigns(3, selectedSite?.id);

        if (response.success && response.data) {
          setRecentCampaigns(response.data);
        } else {
          setError('No se pudieron cargar las campañas recientes');
        }
      } catch (err) {
        console.error('Error loading recent campaigns:', err);
        setError('Error al cargar las campañas recientes');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentCampaigns();
  }, [selectedSite?.id]); // Dependencia agregada

  // Use real campaigns or fallback to default message
  const displayNotifications = recentCampaigns.length > 0
    ? recentCampaigns.map(campaign => ({
      title: campaign.title,
      time: campaign.time
    }))
    : [
      { title: "No hay campañas recientes disponibles", time: "Sin fecha" }
    ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Settings</h1>
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">
            Active
          </span>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left Panel - Settings Form */}
        <div className="flex-1 max-w-md">
          {/* Styling Options */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">Styling options</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Style:</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option>Rounded</option>
                  <option>Square</option>
                  <option>Circle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Position:</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option>Bottom Left</option>
                  <option>Bottom Right</option>
                  <option>Top Left</option>
                  <option>Top Right</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Theme:</label>
                <div className="flex gap-2">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option>Dark</option>
                    <option>Light</option>
                    <option>Auto</option>
                  </select>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Pop-up Style:</label>
                <select
                  value={popupStyle}
                  onChange={(e) => setPopupStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option>Standard</option>
                  <option>Minimal</option>
                  <option>Compact</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Offset (px):</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">x-axis</span>
                    <input
                      type="number"
                      value={xAxis}
                      onChange={(e) => setXAxis(e.target.value)}
                      className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">y-axis</span>
                    <input
                      type="number"
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Configuration */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">Action button configuration</h2>

            <div className="space-y-6">
              {/* Default */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title:</label>
                    <textarea
                      value={defaultTitle}
                      onChange={(e) => setDefaultTitle(e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Button text:</label>
                    <input
                      type="text"
                      value={defaultButtonText}
                      onChange={(e) => setDefaultButtonText(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* When user is subscribed to Push */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">When user is subscribed to Push</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title:</label>
                    <textarea
                      value={subscribedTitle}
                      onChange={(e) => setSubscribedTitle(e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Button text:</label>
                    <input
                      type="text"
                      value={subscribedButtonText}
                      onChange={(e) => setSubscribedButtonText(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* When user has unsubscribed to Push */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">When user has unsubscribed to Push</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title:</label>
                    <textarea
                      value={unsubscribedTitle}
                      onChange={(e) => setUnsubscribedTitle(e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Button Text:</label>
                    <input
                      type="text"
                      value={unsubscribedButtonText}
                      onChange={(e) => setUnsubscribedButtonText(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Show last 3 notifications */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">Show last 3 notifications:</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLastNotifications}
                  onChange={(e) => setShowLastNotifications(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${showLastNotifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${showLastNotifications ? 'translate-x-5' : 'translate-x-1'
                    }`}></div>
                </div>
              </label>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">Heading</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Default:</label>
                <textarea
                  value={defaultHeading}
                  onChange={(e) => setDefaultHeading(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">When user is subscribed to push:</label>
                <textarea
                  value={subscribedHeading}
                  onChange={(e) => setSubscribedHeading(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
              Hide Subscription Bell
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Update Settings
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 max-w-lg">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">Preview</h2>
          </div>

          {/* Preview Tabs */}
          <div className="mb-4">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded">
              {["Default", "When Subscribed", "When Unsubscribed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${previewTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Content */}
          <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-lg h-96 relative overflow-hidden">
            {/* Bell Icon */}
            <div className="absolute bottom-4 right-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-600 transition-colors">
                <span className="text-white text-xl">🔔</span>
              </div>
            </div>

            {/* Close button */}
            <button className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-xs">
              ×
            </button>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 max-w-sm mx-auto mt-8">
              {showLastNotifications && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
                    {previewTab === "When Subscribed" ? subscribedHeading : defaultHeading}
                  </h3>
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="border border-gray-200 dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-800">
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                          Cargando notificaciones...
                        </div>
                      </div>
                    ) : error ? (
                      <div className="border border-red-200 dark:border-red-800 rounded p-2 bg-red-50 dark:bg-red-900/20">
                        <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                          Error al cargar notificaciones
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400">
                          {error}
                        </div>
                      </div>
                    ) : (
                      displayNotifications.map((notification, index) => (
                        <div key={index} className="border border-blue-200 dark:border-blue-800 rounded p-2 bg-blue-50 dark:bg-blue-900/20">
                          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {previewTab === "Default" && defaultTitle}
                  {previewTab === "When Subscribed" && subscribedTitle}
                  {previewTab === "When Unsubscribed" && unsubscribedTitle}
                </p>

                <button className="w-full bg-blue-500 text-white py-2 px-4 rounded font-medium hover:bg-blue-600 transition-colors">
                  {previewTab === "Default" && defaultButtonText}
                  {previewTab === "When Subscribed" && subscribedButtonText}
                  {previewTab === "When Unsubscribed" && unsubscribedButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}