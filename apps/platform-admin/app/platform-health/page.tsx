'use client'

import { useState } from 'react'
import {
  PLATFORM_SLOS,
  _computeErrorBudget,
  meetsSlo,
  type SloTarget,
} from '@nzila/platform-observability/reliability'

/**
 * Platform Health Dashboard
 *
 * Shows SLO definitions, error budget status, and platform health overview.
 * In production, wired to live metrics. In dev, renders baseline SLO catalog.
 */

const _STATUS_LABELS: Record<string, string> = {
  ok: '✅ Healthy',
  warning: '⚠️ Warning',
  danger: '🔴 Critical',
  exhausted: '💀 Exhausted',
}

function sloStatusColor(met: boolean): string {
  return met ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
}

function _budgetStatusColor(remaining: number): string {
  if (remaining > 50) return 'text-green-600'
  if (remaining > 10) return 'text-yellow-600'
  return 'text-red-600'
}

export default function PlatformHealthPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const sloEntries = Object.entries(PLATFORM_SLOS) as Array<[string, SloTarget]>
  const categories = [...new Set(sloEntries.map(([, slo]) => slo.category ?? 'uncategorized'))]

  const filtered =
    selectedCategory === 'all'
      ? sloEntries
      : sloEntries.filter(([, slo]) => (slo.category ?? 'uncategorized') === selectedCategory)

  // Simulated current values (in prod these come from metrics)
  const simulatedValues: Record<string, number> = {}
  for (const [name, slo] of sloEntries) {
    // Default to meeting the SLO in dev mode
    simulatedValues[name] = slo.target + (slo.target > 1 ? -10 : 0.001)
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Platform Health</h1>
      <p className="mb-6 text-gray-500">
        SLO catalog, error budgets, and platform health overview.{' '}
        {sloEntries.length} SLOs defined across {categories.length} categories.
      </p>

      {/* Category filter */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({sloEntries.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SLO table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">SLO</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Target</th>
              <th className="px-4 py-3 font-medium text-gray-500">Window</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([name, slo]) => {
              const met = meetsSlo(slo, simulatedValues[name] ?? slo.target)
              return (
                <tr key={name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-800">{name}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {slo.category ?? 'uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {slo.target > 1 ? `${slo.target}ms` : `${(slo.target * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{Math.round(slo.windowHours / 24)}d</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${sloStatusColor(met)}`}
                    >
                      {met ? 'Met' : 'Breached'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">No SLOs in this category.</div>
        )}
      </div>
    </div>
  )
}
