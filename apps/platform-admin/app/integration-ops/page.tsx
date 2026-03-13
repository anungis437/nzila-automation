'use client'

import { useState } from 'react'
import { IntegrationEventTypes } from '@nzila/integrations-core/events'
import { DEFAULT_TIMEOUT_CONFIG } from '@nzila/integrations-runtime/timeout'

/** Inlined to avoid pulling server-side deps from classified-retry barrel */
const DEFAULT_CLASSIFIED_RETRY_CONFIG = {
  retry: { maxAttempts: 3, initialDelayMs: 1_000, maxDelayMs: 30_000, backoffMultiplier: 2 },
  timeout: DEFAULT_TIMEOUT_CONFIG,
} as const

/**
 * Integration Ops Dashboard
 *
 * Operational view into the integration subsystem: event taxonomy,
 * timeout budgets, retry configuration, and provider health overview.
 * In production, wired to live metrics via telemetry-bridge.
 */

const eventEntries = Object.entries(IntegrationEventTypes)
const timeoutEntries = Object.entries(DEFAULT_TIMEOUT_CONFIG.overrides)

function _statusBadge(status: string) {
  const colors: Record<string, string> = {
    ok: 'bg-green-50 text-green-700',
    degraded: 'bg-yellow-50 text-yellow-700',
    down: 'bg-red-50 text-red-700',
  }
  return colors[status] ?? 'bg-gray-50 text-gray-600'
}

export default function IntegrationOpsPage() {
  const [tab, setTab] = useState<'events' | 'timeouts' | 'retry'>('events')
  const [eventFilter, setEventFilter] = useState('')

  const filteredEvents = eventFilter
    ? eventEntries.filter(([, v]) => v.toLowerCase().includes(eventFilter.toLowerCase()))
    : eventEntries

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Integration Ops</h1>
      <p className="mb-6 text-gray-500">
        {eventEntries.length} event types · {timeoutEntries.length} provider timeouts ·
        max {DEFAULT_CLASSIFIED_RETRY_CONFIG.retry.maxAttempts} retry attempts
      </p>

      {/* Tab bar */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(['events', 'timeouts', 'retry'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'events' ? 'Event Taxonomy' : t === 'timeouts' ? 'Timeout Budgets' : 'Retry Config'}
          </button>
        ))}
      </div>

      {/* Event taxonomy */}
      {tab === 'events' && (
        <>
          <div className="mb-3">
            <input
              type="text"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              placeholder="Filter events..."
              className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium text-gray-500">Event Type</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Domain</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(([, value]) => {
                  const parts = value.split('.')
                  const domain = parts[0] ?? 'unknown'
                  const category = parts[1] ?? 'unknown'
                  return (
                    <tr key={value} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-blue-600">{value}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {domain}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">{category}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Timeout budgets */}
      {tab === 'timeouts' && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-500">Provider</th>
                <th className="px-4 py-3 font-medium text-gray-500">Timeout (ms)</th>
                <th className="px-4 py-3 font-medium text-gray-500">Timeout (s)</th>
              </tr>
            </thead>
            <tbody>
              {timeoutEntries.map(([provider, ms]) => (
                <tr key={provider} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-800">{provider}</td>
                  <td className="px-4 py-2 font-mono text-xs">{ms.toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{(ms / 1000).toFixed(1)}s</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs font-medium text-gray-600">
                  default (fallback)
                </td>
                <td className="px-4 py-2 font-mono text-xs">
                  {DEFAULT_TIMEOUT_CONFIG.defaultMs.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  {(DEFAULT_TIMEOUT_CONFIG.defaultMs / 1000).toFixed(1)}s
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Retry config */}
      {tab === 'retry' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Classified Retry Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-400">Max Attempts</div>
              <div className="mt-1 text-2xl font-bold text-gray-800">
                {DEFAULT_CLASSIFIED_RETRY_CONFIG.retry.maxAttempts}
              </div>
            </div>
            <div className="rounded border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-400">Initial Delay</div>
              <div className="mt-1 text-2xl font-bold text-gray-800">
                {DEFAULT_CLASSIFIED_RETRY_CONFIG.retry.initialDelayMs}ms
              </div>
            </div>
            <div className="rounded border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-400">Max Delay</div>
              <div className="mt-1 text-2xl font-bold text-gray-800">
                {(DEFAULT_CLASSIFIED_RETRY_CONFIG.retry.maxDelayMs / 1000).toFixed(0)}s
              </div>
            </div>
            <div className="rounded border border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-400">Backoff Multiplier</div>
              <div className="mt-1 text-2xl font-bold text-gray-800">
                {DEFAULT_CLASSIFIED_RETRY_CONFIG.retry.backoffMultiplier}×
              </div>
            </div>
          </div>
          <div className="mt-4 rounded bg-blue-50 p-3 text-xs text-blue-700">
            Failure classification drives retry decisions: transient errors (rate limits, timeouts,
            network) are retried with exponential backoff. Permanent errors (validation, auth)
            are immediately routed to DLQ.
          </div>
        </div>
      )}
    </div>
  )
}
