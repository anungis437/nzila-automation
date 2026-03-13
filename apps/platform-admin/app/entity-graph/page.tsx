'use client'

import { useState } from 'react'
import {
  createInMemoryGraphStore as _createInMemoryGraphStore,
  type _EntityGraphStore,
  type EntityNode as _EntityNode,
  getEntityNode as _getEntityNode,
  getEntityNeighbors as _getEntityNeighbors,
  buildEntitySubgraph as _buildEntitySubgraph,
} from '@nzila/platform-entity-graph'
import { OntologyEntityTypes as _OntologyEntityTypes } from '@nzila/platform-ontology'

export default function EntityGraphExplorer() {
  const [nodeId, setNodeId] = useState('')
  const [depth, setDepth] = useState(1)
  const [result, setResult] = useState<string | null>(null)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Entity Graph Explorer</h1>
      <p className="mb-6 text-gray-500">
        Explore entity relationships via BFS traversal. Enter an entity node ID
        to inspect neighbors and subgraphs.
      </p>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase text-gray-400">
          Query
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            placeholder="Entity Node ID"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            min={1}
            max={5}
            className="w-20 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => setResult(`Query: node=${nodeId}, depth=${depth}`)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Traverse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Available Operations
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="rounded bg-gray-50 px-3 py-2">
              <code className="font-mono text-xs text-blue-600">getEntityNode(store, id)</code>
              <p className="mt-1 text-gray-500">Retrieve a single entity node by ID</p>
            </li>
            <li className="rounded bg-gray-50 px-3 py-2">
              <code className="font-mono text-xs text-blue-600">getEntityNeighbors(store, id, depth)</code>
              <p className="mt-1 text-gray-500">BFS traversal to find neighbors up to N hops</p>
            </li>
            <li className="rounded bg-gray-50 px-3 py-2">
              <code className="font-mono text-xs text-blue-600">buildEntitySubgraph(store, id, depth)</code>
              <p className="mt-1 text-gray-500">Extract a subgraph rooted at the given entity</p>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Result
          </h2>
          {result ? (
            <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-xs text-gray-700">
              {result}
            </pre>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">
              Run a query to see results
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
