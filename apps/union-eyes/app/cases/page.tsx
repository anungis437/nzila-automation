/**
 * apps/union-eyes/app/cases/page.tsx
 *
 * Case list page — renders a table of UE cases with ML priority and SLA risk badges.
 *
 * CONSTRAINT: ML signals are fetched via useCaseListSignals() (→ @nzila/ml-sdk).
 * No DB imports anywhere in this file.
 *
 * The actual case list is expected to be loaded from a UE-internal API or
 * passed via a server component. Here we provide the client shell that attaches
 * signals once the case list is available.
 */
'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useCaseListSignals } from '@/lib/useUEMlSignals'
import { PriorityBadge } from '@/components/ml/PriorityBadge'
import { SlaRiskBadge } from '@/components/ml/SlaRiskBadge'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Minimal case shape expected from the UE cases API.
 * Extend as the UE data layer stabilises.
 */
export interface UECase {
  id: string
  entityId: string
  category: string
  channel: string
  status: string
  assignedQueue: string | null
  priority: string
  slaBreached: boolean
  reopenCount: number
  messageCount: number
  attachmentCount: number
  createdAt: string
  updatedAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trailingWindow(days = 90) {
  const today = new Date()
  const start = new Date(today.getTime() - days * 24 * 3600 * 1000)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
  }
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonBadge() {
  return <span className="inline-block h-5 w-16 rounded bg-gray-100 animate-pulse" />
}

// ── Case row ──────────────────────────────────────────────────────────────────

function CaseRow({
  ue,
  priorityScore,
  slaScore,
  signalsLoading,
}: {
  ue: UECase
  priorityScore: ReturnType<typeof useCaseListSignals>['priority']['get'] extends (
    key: string,
  ) => infer R
    ? R
    : never
  slaScore: ReturnType<typeof useCaseListSignals>['slaRisk']['get'] extends (
    key: string,
  ) => infer R
    ? R
    : never
  signalsLoading: boolean
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-indigo-600">
        <Link href={`/cases/${ue.id}`} className="hover:underline">
          {ue.id.slice(0, 8)}…
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{ue.category}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{ue.channel}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{ue.status}</td>
      <td className="px-4 py-3">
        {signalsLoading ? (
          <SkeletonBadge />
        ) : (
          <PriorityBadge score={priorityScore ?? null} isLoading={false} showConfidence={false} />
        )}
      </td>
      <td className="px-4 py-3">
        {signalsLoading ? (
          <SkeletonBadge />
        ) : (
          <SlaRiskBadge score={slaScore ?? null} isLoading={false} showProbability />
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {new Date(ue.createdAt).toLocaleDateString()}
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface CasesPageProps {
  /** Pre-fetched or server-rendered UE cases, injected via a parent Server Component. */
  cases?: UECase[]
  entityId: string
}

/**
 * CasesPage renders the case list and attaches ML signals in the client layer.
 *
 * Usage (from a Next.js Server Component wrapper):
 *   <CasesPage entityId={entityId} cases={await fetchUECases(entityId)} />
 */
export default function CasesPage({ cases = [], entityId }: CasesPageProps) {
  const { getToken } = useAuth()
  const { startDate, endDate } = useMemo(() => trailingWindow(90), [])
  const [search, setSearch] = useState('')

  const signals = useCaseListSignals(entityId, startDate, endDate, getToken)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cases
    return cases.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q),
    )
  }, [cases, search])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500">
            {cases.length} case{cases.length !== 1 ? 's' : ''} · ML signals from last 90 days
          </p>
        </div>
        <input
          type="search"
          placeholder="Search cases…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Signals error banner (non-fatal) */}
      {signals.error && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          ML signals are temporarily unavailable — priority and risk columns are hidden.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Case ID', 'Category', 'Channel', 'Status', 'ML Priority', 'SLA Risk', 'Created'].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  {search ? 'No cases match your search.' : 'No cases found.'}
                </td>
              </tr>
            ) : (
              filtered.map((ue) => (
                <CaseRow
                  key={ue.id}
                  ue={ue}
                  priorityScore={signals.priority.get(ue.id)}
                  slaScore={signals.slaRisk.get(ue.id)}
                  signalsLoading={signals.isLoading}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {!signals.isLoading && !signals.error && (
        <p className="text-xs text-gray-400">
          Priority and SLA risk are ML predictions. They do not replace staff judgment.
        </p>
      )}
    </div>
  )
}
