'use client'

import { useState } from 'react'
import {
  DecisionTypes,
  DecisionStatuses,
  ActorTypes,
  DecisionEdgeTypes,
} from '@nzila/platform-decision-graph'

const decisionTypes = Object.entries(DecisionTypes)
const decisionStatuses = Object.entries(DecisionStatuses)
const actorTypes = Object.entries(ActorTypes)
const edgeTypes = Object.entries(DecisionEdgeTypes)

export default function DecisionTrailViewer() {
  const [trailId, setTrailId] = useState('')

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Decision Trail Viewer</h1>
      <p className="mb-6 text-gray-500">
        Explore decision audit trails — every decision is an auditable graph
        node with full lineage.
      </p>

      {/* Lookup */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
          Trail Lookup
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={trailId}
            onChange={(e) => setTrailId(e.target.value)}
            placeholder="Decision Node ID"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Load Trail
          </button>
        </div>
      </div>

      {/* Reference */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Decision Types ({decisionTypes.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {decisionTypes.map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Statuses ({decisionStatuses.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {decisionStatuses.map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Actor Types ({actorTypes.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {actorTypes.map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Edge Types ({edgeTypes.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {edgeTypes.map(([key, value]) => (
              <span
                key={key}
                className="rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
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
