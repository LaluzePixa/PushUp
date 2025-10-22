'use client';
import { useState } from "react";

export default function NotificationCardsPage() {
  const [notificationCard, setNotificationCard] = useState("Enable");
  const [theme, setTheme] = useState("Light");
  const [autoHide, setAutoHide] = useState("True");
  const [autoHideDelay, setAutoHideDelay] = useState("10");

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">
            Active
          </span>
        </div>
      </div>

      <div className="flex gap-12">
        {/* Left Panel - Settings Form */}
        <div className="flex-1 max-w-md">
          <div className="space-y-6">
            <div className="flex items-center">
              <label className="text-gray-700 font-medium w-40">
                Notification Card:
              </label>
              <select 
                value={notificationCard}
                onChange={(e) => setNotificationCard(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>Enable</option>
                <option>Disable</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium w-40">
                Theme:
              </label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>Light</option>
                <option>Dark</option>
                <option>Auto</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium w-40">
                Auto Hide:
              </label>
              <select 
                value={autoHide}
                onChange={(e) => setAutoHide(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>True</option>
                <option>False</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium w-40">
                Auto Hide Delay:
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  value={autoHideDelay}
                  onChange={(e) => setAutoHideDelay(e.target.value)}
                  className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">Seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 max-w-lg">
          <div className="mb-4">
            <h2 className="text-gray-700 font-medium">Preview</h2>
          </div>

          {/* Preview Area */}
          <div className="bg-gray-300 rounded-lg h-80 relative p-4">
            {/* Notification Card */}
            {notificationCard === "Enable" && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-blue-600 font-medium text-sm mb-1">
                      Title of your last push notification
                    </h3>
                    <p className="text-gray-500 text-xs">
                      1 minute ago
                    </p>
                  </div>
                  <button 
                    className="ml-2 w-5 h-5 bg-black bg-opacity-70 rounded-full flex items-center justify-center text-white text-xs hover:bg-opacity-80"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Settings Button */}
      <div className="flex justify-end mt-8">
        <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium">
          Update Settings
        </button>
      </div>
    </div>
  );
}