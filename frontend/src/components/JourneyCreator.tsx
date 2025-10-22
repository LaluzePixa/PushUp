'use client'

import { useState, useEffect } from "react"
import { Check, Plus, Clock } from "lucide-react"
import { dashboardService, UserSegment } from "@/services/api"

export default function JourneyCreator() {
  const [journeyName, setJourneyName] = useState("Journey Name")
  const [selectedSegment, setSelectedSegment] = useState("all_users")
  const [waitTime, setWaitTime] = useState("2")
  const [timeUnit, setTimeUnit] = useState("Hour(s)")
  const [sendImmediately, setSendImmediately] = useState(false)
  const [segments, setSegments] = useState<UserSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeUserCount, setActiveUserCount] = useState(0)

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        setLoading(true)
        const response = await dashboardService.getSegments()

        if (response.success && response.data) {
          setSegments(response.data)
          // Establecer el primer segmento como seleccionado por defecto
          if (response.data.length > 0) {
            setSelectedSegment(response.data[0].value)
            setActiveUserCount(response.data[0].userCount)
          }
        }
      } catch (err) {
        console.error('Error fetching segments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSegments()
  }, [])

  const handleSegmentChange = (value: string) => {
    setSelectedSegment(value)
    const segment = segments.find(s => s.value === value)
    setActiveUserCount(segment?.userCount || 0)
  }

  const handleSave = () => {
    console.log("Saving journey...")
  }

  const handleCancel = () => {
    console.log("Cancelling...")
  }

  const handleCreatePush = () => {
    console.log("Creating push notification...")
  }

  const handleAddNotification = () => {
    console.log("Adding notification...")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50">

      {/* Journey Name Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Journey Name</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={journeyName}
            onChange={(e) => setJourneyName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Journey Name"
          />
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition-colors"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Select Segment Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select who enters this Journey</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Segment:
            </label>
            <div className="flex items-center justify-between">
              <select
                value={selectedSegment}
                onChange={(e) => handleSegmentChange(e.target.value)}
                className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {loading ? (
                  <option value="">Cargando segmentos...</option>
                ) : (
                  segments.map((segment) => (
                    <option key={segment.value} value={segment.value}>
                      {segment.name} ({segment.userCount} usuarios)
                    </option>
                  ))
                )}
              </select>

              <div className="text-sm text-gray-600">
                Usuarios activos en este segmento: <span className="font-bold text-xl">{activeUserCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-blue-600">
            <strong>Note:</strong> You cannot change the segment once a user has entered this journey.
          </div>
        </div>
      </div>

      {/* Timing Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-px h-12 bg-gray-300"></div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 my-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gray-600 text-white px-3 py-1 rounded-md flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Wait
            </div>
            <input
              type="number"
              value={waitTime}
              onChange={(e) => setWaitTime(e.target.value)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Minute(s)">Minute(s)</option>
              <option value="Hour(s)">Hour(s)</option>
              <option value="Day(s)">Day(s)</option>
              <option value="Week(s)">Week(s)</option>
            </select>
          </div>

          <div className="text-center text-gray-500 text-sm my-2">OR</div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendImmediately"
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sendImmediately" className="text-sm text-gray-700">
              Send immediately
            </label>
          </div>
        </div>

        <div className="w-px h-12 bg-gray-300"></div>
      </div>

      {/* Send Push Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Send Push #1</h2>

        <div className="flex items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <button
            onClick={handleCreatePush}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            Create Push
          </button>
        </div>
      </div>

      {/* Add Notification Button */}
      <div className="flex justify-center mb-8">
        <div className="w-px h-12 bg-gray-300 mb-4"></div>
        <div className="absolute">
          <button
            onClick={handleAddNotification}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Notification
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-8">
        <button
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  )
}