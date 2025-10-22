'use client';
import { useState } from "react";

export default function WelcomeNotificationPage() {
  const [title, setTitle] = useState("Thank you for subscribing!");
  const [body, setBody] = useState("We'll notify you on latest news and updates");
  const [destinationUrl, setDestinationUrl] = useState("http://patata.com");
  const [selectedOs, setSelectedOs] = useState("Windows");

  const InfoIcon = () => (
    <svg className="w-4 h-4 text-gray-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );

  const WindowsIcon = () => (
    <div className="w-6 h-6 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z" />
      </svg>
    </div>
  );

  const MacIcon = () => (
    <div className="w-6 h-6 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
      </svg>
    </div>
  );

  const AndroidIcon = () => (
    <div className="w-6 h-6 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.6,9.48L16.69,8.45C17.06,7.43 17.06,6.22 16.69,5.17L17.6,4.14C17.84,3.89 17.84,3.5 17.6,3.24C17.35,3 16.96,3 16.7,3.24L15.8,4.27C14.8,3.33 13.5,2.82 12.16,2.82C10.82,2.82 9.5,3.33 8.5,4.27L7.6,3.24C7.35,3 6.96,3 6.7,3.24C6.46,3.5 6.46,3.89 6.7,4.14L7.61,5.17C7.24,6.22 7.24,7.43 7.61,8.45L6.7,9.48C6.46,9.73 6.46,10.12 6.7,10.38C6.96,10.64 7.35,10.64 7.6,10.38L8.5,9.35C9.5,10.29 10.82,10.8 12.16,10.8C13.5,10.8 14.8,10.29 15.8,9.35L16.7,10.38C16.96,10.64 17.35,10.64 17.6,10.38C17.84,10.12 17.84,9.73 17.6,9.48M10.25,6.75C9.96,6.75 9.72,6.51 9.72,6.22C9.72,5.93 9.96,5.69 10.25,5.69C10.54,5.69 10.78,5.93 10.78,6.22C10.78,6.51 10.54,6.75 10.25,6.75M14.03,6.75C13.74,6.75 13.5,6.51 13.5,6.22C13.5,5.93 13.74,5.69 14.03,5.69C14.32,5.69 14.56,5.93 14.56,6.22C14.56,6.51 14.32,6.75 14.03,6.75M12,13.5A1.5,1.5 0 0,1 10.5,12A1.5,1.5 0 0,1 12,10.5A1.5,1.5 0 0,1 13.5,12A1.5,1.5 0 0,1 12,13.5Z" />
      </svg>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-800">Welcome Notification</h1>
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">
            Active
          </span>
        </div>
      </div>

      <div className="flex gap-12">
        {/* Left Panel - Settings Form */}
        <div className="flex-1 max-w-md">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center mb-2">
                <label className="text-gray-700 font-medium">Title</label>
                <InfoIcon />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Icon and Image Upload */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <label className="text-gray-700 font-medium">Icon</label>
                  <InfoIcon />
                </div>
                <button className="w-full p-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Upload
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <label className="text-gray-700 font-medium">Image</label>
                  <InfoIcon />
                </div>
                <button className="w-full p-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Upload
                </button>
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center mb-2">
                <label className="text-gray-700 font-medium">Body</label>
                <InfoIcon />
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Destination/URL */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Destination/URL</label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium">
                Deactivate
              </button>
              <button className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors font-medium">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 max-w-2xl">
          {/* OS Tabs */}
          <div className="mb-6">
            <div className="flex gap-8">
              {[
                { name: "Windows", icon: <WindowsIcon /> },
                { name: "Mac", icon: <MacIcon /> },
                { name: "Android", icon: <AndroidIcon /> }
              ].map((os) => (
                <button
                  key={os.name}
                  onClick={() => setSelectedOs(os.name)}
                  className={`flex flex-col items-center gap-2 pb-2 px-4 transition-colors ${
                    selectedOs === os.name 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className={selectedOs === os.name ? 'text-blue-500' : 'text-gray-400'}>
                    {os.icon}
                  </div>
                  <span className="text-sm font-medium">{os.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Windows Desktop Preview */}
          {selectedOs === "Windows" && (
            <div className="relative bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 rounded-lg h-96 overflow-hidden">
              {/* Windows Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-8 left-8 w-32 h-32 border-2 border-white transform rotate-12"></div>
                <div className="absolute top-16 left-24 w-24 h-24 border border-white transform -rotate-6"></div>
              </div>

              {/* Notification */}
              <div className="absolute bottom-12 right-4 bg-white rounded shadow-lg p-4 max-w-xs border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                    🌐
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {title}
                      </h3>
                      <button className="text-gray-400 hover:text-gray-600 text-lg leading-none">
                        ×
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {body}
                    </p>
                    <p className="text-gray-500 text-xs">
                      now • {destinationUrl.replace('http://', '').replace('https://', '')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Windows Taskbar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-80 h-10 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <WindowsIcon />
                  </div>
                  <div className="w-8 h-6 bg-gray-600 rounded"></div>
                  <div className="w-8 h-6 bg-gray-600 rounded"></div>
                </div>
                <div className="text-white text-xs">
                  11:50 AM<br />
                  2/14/2019
                </div>
              </div>
            </div>
          )}

          {/* Mac Preview Placeholder */}
          {selectedOs === "Mac" && (
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">Mac notification preview</p>
            </div>
          )}

          {/* Android Preview Placeholder */}
          {selectedOs === "Android" && (
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">Android notification preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}