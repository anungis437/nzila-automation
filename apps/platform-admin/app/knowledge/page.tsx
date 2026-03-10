'use client'

import { useState } from 'react'
import { KnowledgeTypes } from '@nzila/platform-knowledge-registry'

const knowledgeTypes = Object.entries(KnowledgeTypes)

export default function KnowledgeRegistryManager() {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Knowledge Registry</h1>
      <p className="mb-6 text-gray-500">
        Manage knowledge assets — policies, rules, playbooks, templates.{' '}
        {knowledgeTypes.length} asset types available.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Knowledge Types */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Asset Types
          </h2>
          <ul className="space-y-1">
            {knowledgeTypes.map(([key, value]) => (
              <li key={key}>
                <button
                  onClick={() => setSelectedType(value)}
                  className={`w-full rounded px-3 py-2 text-left text-sm ${
                    selectedType === value
                      ? 'bg-blue-50 font-medium text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        <div className="col-span-2 rounded-lg border border-gray-200 bg-white p-6">
          {selectedType ? (
            <>
              <h2 className="mb-4 text-lg font-semibold capitalize">
                {selectedType.replace(/_/g, ' ')} Assets
              </h2>
              <p className="text-sm text-gray-500">
                In production, this panel lists all registered knowledge assets
                of type <code className="font-mono text-blue-600">{selectedType}</code>{' '}
                with version history and applicability rules.
              </p>

              <div className="mt-4 rounded bg-gray-50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
                  Operations
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <code className="font-mono text-xs text-blue-600">registerKnowledgeAsset()</code> — Register a new asset
                  </li>
                  <li>
                    <code className="font-mono text-xs text-blue-600">searchKnowledge()</code> — Full-text search across assets
                  </li>
                  <li>
                    <code className="font-mono text-xs text-blue-600">getAssetVersion()</code> — Retrieve specific version
                  </li>
                  <li>
                    <code className="font-mono text-xs text-blue-600">resolveApplicableKnowledge()</code> — Find applicable to entity
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select a knowledge type to manage assets
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
