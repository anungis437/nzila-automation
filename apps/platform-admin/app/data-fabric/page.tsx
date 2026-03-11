'use client'

import { useState } from 'react'
import { SourceSystemCategories, SyncStatuses, ResolutionStrategies } from '@nzila/platform-data-fabric/types'

const categories = Object.entries(SourceSystemCategories)
const syncStatuses = Object.entries(SyncStatuses)
const resolutions = Object.entries(ResolutionStrategies)

export default function DataFabricExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Data Fabric</h1>
      <p className="mb-6 text-gray-500">
        Canonical data plane — ingest, map, reconcile, and sync from{' '}
        {categories.length} source system categories.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Source System Categories */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Source Categories
          </h2>
          <ul className="space-y-1">
            {categories.map(([key, value]) => (
              <li key={key}>
                <button
                  onClick={() => setSelectedCategory(value)}
                  className={`w-full rounded px-3 py-2 text-left text-sm ${
                    selectedCategory === value
                      ? 'bg-blue-50 font-medium text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value.replace(/_/g, ' ')}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        <div className="col-span-2 space-y-4">
          {/* Sync Statuses */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
              Sync Statuses
            </h2>
            <div className="flex flex-wrap gap-2">
              {syncStatuses.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>

          {/* Resolution Strategies */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
              Conflict Resolution
            </h2>
            <div className="flex flex-wrap gap-2">
              {resolutions.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
              Data Pipeline
            </h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="rounded bg-gray-50 px-3 py-2">
                <strong>1. Ingest</strong> — Fetch records from external
                systems via registered SourceAdapters
              </li>
              <li className="rounded bg-gray-50 px-3 py-2">
                <strong>2. Map</strong> — Transform source records to canonical
                format using mapping rules
              </li>
              <li className="rounded bg-gray-50 px-3 py-2">
                <strong>3. Reconcile</strong> — Detect conflicts across sources
                and persist lineage
              </li>
              <li className="rounded bg-gray-50 px-3 py-2">
                <strong>4. Resolve</strong> — Apply resolution strategies for
                conflicting data
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
