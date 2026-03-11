'use client'

import { useState } from 'react'
import { PlatformEventTypes } from '@nzila/platform-event-fabric/types'

const eventTypes = Object.entries(PlatformEventTypes)

export default function EventStreamViewer() {
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? eventTypes.filter(
        ([key, value]) =>
          key.toLowerCase().includes(filter.toLowerCase()) ||
          value.toLowerCase().includes(filter.toLowerCase()),
      )
    : eventTypes

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Event Stream Viewer</h1>
      <p className="mb-6 text-gray-500">
        Browse {eventTypes.length} platform event types. In production, this
        view connects to the event bus for real-time streaming and replay.
      </p>

      <div className="mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter event types..."
          className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Constant</th>
              <th className="px-4 py-3 font-medium text-gray-500">Event Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Domain</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([key, value]) => {
              const domain = value.split('.')[0] ?? 'unknown'
              return (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">
                    {key}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-blue-600">
                    {value}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {domain}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No event types match &ldquo;{filter}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
