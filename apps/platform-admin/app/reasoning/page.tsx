'use client'

import { useState } from 'react'
import { ReasoningTypes, ReasoningStatuses } from '@nzila/platform-reasoning-engine'

const reasoningTypes = Object.entries(ReasoningTypes)
const reasoningStatuses = Object.entries(ReasoningStatuses)

export default function ReasoningExplorer() {
  const [chainId, setChainId] = useState('')

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Reasoning Engine</h1>
      <p className="mb-6 text-gray-500">
        Cross-vertical reasoning with citations and explainability.{' '}
        {reasoningTypes.length} reasoning types supported.
      </p>

      {/* Lookup */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Chain Lookup
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
            placeholder="Reasoning Chain ID"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Load Chain
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reasoning Types */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Reasoning Types
          </h2>
          <ul className="space-y-2">
            {reasoningTypes.map(([key, value]) => (
              <li
                key={key}
                className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700"
              >
                <span className="font-mono text-xs text-blue-600">{value}</span>
                <p className="mt-1 text-xs text-gray-400">
                  {key.replace(/_/g, ' ').toLowerCase()} reasoning strategy
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Chain Structure */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Chain Structure
          </h2>
          <div className="mb-4 text-sm text-gray-600">
            Each reasoning chain contains:
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="rounded bg-gray-50 px-3 py-2">
              <strong>Steps</strong> — Ordered reasoning steps with
              input/output, citations, confidence, and duration
            </li>
            <li className="rounded bg-gray-50 px-3 py-2">
              <strong>Conclusion</strong> — Summary, recommendation, risk
              level, confidence, and alternative conclusions
            </li>
            <li className="rounded bg-gray-50 px-3 py-2">
              <strong>Citations</strong> — Source references: policy, knowledge,
              event, decision, entity, or data
            </li>
            <li className="rounded bg-gray-50 px-3 py-2">
              <strong>Cross-Vertical Insights</strong> — Patterns detected
              across industry verticals
            </li>
          </ul>

          <h3 className="mb-2 mt-4 text-sm font-semibold uppercase text-gray-400">
            Statuses
          </h3>
          <div className="flex flex-wrap gap-2">
            {reasoningStatuses.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
