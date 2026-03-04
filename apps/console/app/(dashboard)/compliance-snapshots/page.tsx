/**
 * Nzila OS — Console: Compliance Snapshots Dashboard
 *
 * Browse compliance snapshots across all orgs:
 *   - Hash-chained snapshot timeline
 *   - Control family coverage breakdown
 *   - Compliance score tracking
 *   - Chain verification status
 *
 * @see @nzila/platform-compliance-snapshots
 */
import { requireRole } from '@/lib/rbac'
import type { ComplianceSnapshot as _ComplianceSnapshot } from '@nzila/platform-compliance-snapshots'
import type { HealthStatus as _HealthStatus } from '@nzila/platform-observability'
import {
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Placeholder data ───────────────────────────────────────────────────────

type SnapshotStatus = 'pending' | 'collected' | 'chained' | 'verified' | 'failed'

interface SnapshotRow {
  snapshotId: string
  orgId: string
  version: number
  status: SnapshotStatus
  complianceScore: number
  totalControls: number
  compliant: number
  nonCompliant: number
  partial: number
  notAssessed: number
  collectedAt: string
  chainVerified: boolean
}

function loadSnapshots(): SnapshotRow[] {
  return [
    { snapshotId: 'snap_014', orgId: 'org_acme', version: 14, status: 'verified', complianceScore: 91.3, totalControls: 45, compliant: 38, nonCompliant: 2, partial: 5, notAssessed: 0, collectedAt: '2026-03-04T08:00:00Z', chainVerified: true },
    { snapshotId: 'snap_013', orgId: 'org_acme', version: 13, status: 'verified', complianceScore: 88.9, totalControls: 45, compliant: 36, nonCompliant: 3, partial: 6, notAssessed: 0, collectedAt: '2026-03-03T08:00:00Z', chainVerified: true },
    { snapshotId: 'snap_012', orgId: 'org_acme', version: 12, status: 'verified', complianceScore: 85.0, totalControls: 45, compliant: 34, nonCompliant: 4, partial: 5, notAssessed: 2, collectedAt: '2026-03-02T08:00:00Z', chainVerified: true },
    { snapshotId: 'snap_005', orgId: 'org_beta', version: 5, status: 'verified', complianceScore: 78.6, totalControls: 42, compliant: 30, nonCompliant: 5, partial: 4, notAssessed: 3, collectedAt: '2026-03-04T09:00:00Z', chainVerified: true },
    { snapshotId: 'snap_004', orgId: 'org_beta', version: 4, status: 'chained', complianceScore: 72.5, totalControls: 40, compliant: 26, nonCompliant: 6, partial: 5, notAssessed: 3, collectedAt: '2026-03-03T09:00:00Z', chainVerified: false },
    { snapshotId: 'snap_003', orgId: 'org_beta', version: 3, status: 'verified', complianceScore: 70.0, totalControls: 40, compliant: 24, nonCompliant: 8, partial: 4, notAssessed: 4, collectedAt: '2026-03-02T09:00:00Z', chainVerified: true },
  ]
}

// ── UI Helpers ─────────────────────────────────────────────────────────────

const statusConfig: Record<SnapshotStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
  collected: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Collected' },
  chained: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Chained' },
  verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
}

function StatusBadge({ status }: { status: SnapshotStatus }) {
  const c = statusConfig[status]
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-700 bg-green-100' : score >= 75 ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100'
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${color}`}>{score.toFixed(1)}%</span>
}

function MetricCard({ title, value, icon: Icon, accent }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`h-5 w-5 ${accent}`} />
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default async function ComplianceSnapshotsPage() {
  await requireRole('platform_admin', 'studio_admin', 'ops')

  const snapshots = loadSnapshots()
  const latestAcme = snapshots.find((s) => s.orgId === 'org_acme')
  const latestBeta = snapshots.find((s) => s.orgId === 'org_beta')
  const verifiedCount = snapshots.filter((s) => s.chainVerified).length
  const avgScore = snapshots.length > 0
    ? snapshots.reduce((sum, s) => sum + s.complianceScore, 0) / snapshots.length
    : 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Snapshots</h1>
        <p className="text-gray-500 mt-1">Hash-chained compliance assessment history with verification status</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Total Snapshots" value={String(snapshots.length)} icon={ClipboardDocumentCheckIcon} accent="text-blue-600" />
        <MetricCard title="Chain-Verified" value={`${verifiedCount}/${snapshots.length}`} icon={LinkIcon} accent="text-green-600" />
        <MetricCard title="Avg Score" value={`${avgScore.toFixed(1)}%`} icon={ChartBarIcon} accent="text-indigo-600" />
        <MetricCard title="Orgs Tracked" value={String(new Set(snapshots.map((s) => s.orgId)).size)} icon={ShieldCheckIcon} accent="text-purple-600" />
      </div>

      {/* Org Score Cards */}
      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        {[latestAcme, latestBeta].filter(Boolean).map((snap) => {
          const s = snap!
          return (
            <div key={s.orgId} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{s.orgId}</h3>
                <ScoreBadge score={s.complianceScore} />
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{s.compliant}</p>
                  <p className="text-xs text-gray-500">Compliant</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{s.partial}</p>
                  <p className="text-xs text-gray-500">Partial</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{s.nonCompliant}</p>
                  <p className="text-xs text-gray-500">Non-Compliant</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{s.notAssessed}</p>
                  <p className="text-xs text-gray-500">Not Assessed</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">v{s.version} — {new Date(s.collectedAt).toLocaleDateString()}</p>
            </div>
          )
        })}
      </div>

      {/* Snapshots Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-500" />
          Snapshot History
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Snapshot</th>
              <th className="text-left py-2 text-gray-500 font-medium">Org</th>
              <th className="text-left py-2 text-gray-500 font-medium">Version</th>
              <th className="text-left py-2 text-gray-500 font-medium">Status</th>
              <th className="text-left py-2 text-gray-500 font-medium">Score</th>
              <th className="text-left py-2 text-gray-500 font-medium">Controls</th>
              <th className="text-left py-2 text-gray-500 font-medium">Chain</th>
              <th className="text-left py-2 text-gray-500 font-medium">Collected</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s, i) => (
              <tr key={s.snapshotId} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="py-2 font-mono text-gray-600 text-xs">{s.snapshotId}</td>
                <td className="py-2 text-gray-600">{s.orgId}</td>
                <td className="py-2 text-gray-700">v{s.version}</td>
                <td className="py-2"><StatusBadge status={s.status} /></td>
                <td className="py-2"><ScoreBadge score={s.complianceScore} /></td>
                <td className="py-2 text-gray-700">
                  <span className="text-green-700">{s.compliant}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-yellow-700">{s.partial}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-red-700">{s.nonCompliant}</span>
                </td>
                <td className="py-2">
                  {s.chainVerified
                    ? <span className="flex items-center gap-1 text-green-700"><CheckCircleIcon className="h-4 w-4" /> Verified</span>
                    : <span className="flex items-center gap-1 text-yellow-700"><ExclamationTriangleIcon className="h-4 w-4" /> Pending</span>
                  }
                </td>
                <td className="py-2 text-gray-500">{new Date(s.collectedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
