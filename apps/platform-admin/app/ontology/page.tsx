'use client'

import { useState } from 'react'
import {
  OntologyEntityTypes,
  EntityStatuses,
  RelationshipTypes,
  type OntologyEntityType,
} from '@nzila/platform-ontology'

const entityTypes = Object.entries(OntologyEntityTypes)
const statuses = Object.entries(EntityStatuses)
const relationshipTypes = Object.entries(RelationshipTypes)

export default function OntologyExplorer() {
  const [selectedType, setSelectedType] = useState<OntologyEntityType | null>(null)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Ontology Explorer</h1>
      <p className="mb-6 text-gray-500">
        Browse the canonical business ontology — {entityTypes.length} entity types,{' '}
        {relationshipTypes.length} relationship types, {statuses.length} statuses.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Entity Type List */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Entity Types
          </h2>
          <ul className="max-h-[600px] space-y-1 overflow-y-auto">
            {entityTypes.map(([key, value]) => (
              <li key={key}>
                <button
                  onClick={() => setSelectedType(value)}
                  className={`w-full rounded px-3 py-1.5 text-left text-sm ${
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

        {/* Selected Entity Detail */}
        <div className="col-span-2 rounded-lg border border-gray-200 bg-white p-4">
          {selectedType ? (
            <>
              <h2 className="mb-1 text-lg font-semibold">{selectedType}</h2>
              <p className="mb-4 text-sm text-gray-500">
                Available relationship types for this entity.
              </p>

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 font-medium text-gray-500">Key</th>
                    <th className="pb-2 font-medium text-gray-500">Relationship Type</th>
                  </tr>
                </thead>
                <tbody>
                  {relationshipTypes.map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-50">
                      <td className="py-2 font-mono text-xs text-gray-700">
                        {key}
                      </td>
                      <td className="py-2 text-gray-600">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Select an entity type to view its relationships
            </div>
          )}
        </div>
      </div>

      {/* Statuses & Relationship Type Reference */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Entity Statuses
          </h2>
          <div className="flex flex-wrap gap-2">
            {statuses.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">
            Relationship Types
          </h2>
          <div className="flex flex-wrap gap-2">
            {relationshipTypes.map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
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
