/**
 * Nzila OS — Console: Compliance Snapshots Dashboard
 *
 * Live compliance posture computed from evidence packs:
 *   - Per-org compliance scores from verified evidence
 *   - Control family coverage breakdown
 *   - Chain integrity verification status
 *   - JSON export for audit reports
 *
 * @see @nzila/platform-compliance-snapshots
 * @see @nzila/platform-evidence-pack
 */
import { requireRole } from '@/lib/rbac'
import { platformDb } from '@nzila/db/platform'
import { evidencePacks } from '@nzila/db/schema'
import { desc } from 'drizzle-orm'
import {
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Compliance computed from evidence packs ────────────────────────────────

interface ComplianceView {
  orgId: string
  totalPacks: number
  verifiedPacks: number
  sealedPacks: number
  draftPacks: number
  totalControls: number
  verifiedControls: number
  complianceScore: number
  integrityVerified: boolean
  totalArtifacts: number
  lastActivity: string
}

async function computeComplianceViews(): Promise<ComplianceView[]> {
  const packs = await platformDb
    .select()
    .from(evidencePacks)
    .orderBy(desc(evidencePacks.createdAt))

  const byOrg = new Map<string, (typeof packs)[number][]>()
  for (const p of packs) {
    const existing = byOrg.get(p.orgId) ?? []
    existing.push(p)
    byOrg.set(p.orgId, existing)
  }

  return Array.from(byOrg.entries()).map(([orgId, orgPacks]) => {
    const verified = orgPacks.filter((p) => p.status === 'verified')
    const sealed = orgPacks.filter((p) => p.status === 'sealed')
    const draft = orgPacks.filter((p) => p.status === 'draft')

    const allControls = new Set(
      orgPacks.flatMap((p) => (p.controlsCovered as string[]) ?? []),
    )
    const verifiedControlSet = new Set(
      verified.flatMap((p) => (p.controlsCovered as string[]) ?? []),
    )

    const score =
      allControls.size > 0
        ? Math.round((verifiedControlSet.size / allControls.size) * 1000) / 10
        : 0

    const integrityOk = orgPacks.length > 0 && orgPacks.every((p) => p.chainIntegrity === 'VERIFIED')

    return {
      orgId,
      totalPacks: orgPacks.length,
      verifiedPacks: verified.length,
      sealedPacks: sealed.length,
      draftPacks: draft.length,
      totalControls: allControls.size,
      verifiedControls: verifiedControlSet.size,
      complianceScore: score,
      integrityVerified: integrityOk,
      totalArtifacts: orgPacks.reduce((s, p) => s + p.artifactCount, 0),
      lastActivity: orgPacks[0]?.createdAt?.toISOString() ?? new Date().toISOString(),
    }
  })
}

// ── UI Helpers ─────────────────────────────────────────────────────────────

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

  const views = await computeComplianceViews()
  const totalControls = views.reduce((sum, v) => sum + v.totalControls, 0)
  const verifiedControls = views.reduce((sum, v) => sum + v.verifiedControls, 0)
  const integrityCount = views.filter((v) => v.integrityVerified).length
  const avgScore = views.length > 0
    ? views.reduce((sum, v) => sum + v.complianceScore, 0) / views.length
    : 0

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Snapshots</h1>
          <p className="text-gray-500 mt-1">Live compliance posture computed from evidence packs and chain verification</p>
        </div>
        <a
          href="/api/evidence-packs?download=true"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Export Evidence
        </a>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Orgs Tracked" value={String(views.length)} icon={ShieldCheckIcon} accent="text-purple-600" />
        <MetricCard title="Controls Covered" value={`${verifiedControls}/${totalControls}`} icon={ClipboardDocumentCheckIcon} accent="text-blue-600" />
        <MetricCard title="Chain Verified" value={`${integrityCount}/${views.length}`} icon={LinkIcon} accent="text-green-600" />
        <MetricCard title="Avg Score" value={`${avgScore.toFixed(1)}%`} icon={ChartBarIcon} accent="text-indigo-600" />
      </div>

      {/* Org Compliance Cards */}
      {views.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          {views.map((v) => (
            <div key={v.orgId} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 font-mono text-sm">{v.orgId}</h3>
                <ScoreBadge score={v.complianceScore} />
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{v.verifiedControls}</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{v.sealedPacks}</p>
                  <p className="text-xs text-gray-500">Sealed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{v.draftPacks}</p>
                  <p className="text-xs text-gray-500">Draft</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{v.totalArtifacts}</p>
                  <p className="text-xs text-gray-500">Artifacts</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{v.totalPacks} packs — Last activity {new Date(v.lastActivity).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Details Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-500" />
          Compliance by Organisation
        </h2>
        {views.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No compliance data yet</p>
            <p className="text-sm mt-1">Compliance scores are computed from evidence packs as they are created and verified.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Organisation</th>
                <th className="text-left py-2 text-gray-500 font-medium">Score</th>
                <th className="text-left py-2 text-gray-500 font-medium">Controls</th>
                <th className="text-left py-2 text-gray-500 font-medium">Packs</th>
                <th className="text-left py-2 text-gray-500 font-medium">Artifacts</th>
                <th className="text-left py-2 text-gray-500 font-medium">Chain</th>
                <th className="text-left py-2 text-gray-500 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {views.map((v, i) => (
                <tr key={v.orgId} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 font-mono text-gray-600 text-xs">{v.orgId}</td>
                  <td className="py-2"><ScoreBadge score={v.complianceScore} /></td>
                  <td className="py-2 text-gray-700">
                    <span className="text-green-700">{v.verifiedControls}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-gray-700">{v.totalControls}</span>
                  </td>
                  <td className="py-2 text-gray-700">
                    <span className="text-green-700">{v.verifiedPacks}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-gray-700">{v.totalPacks}</span>
                  </td>
                  <td className="py-2 text-gray-700">{v.totalArtifacts}</td>
                  <td className="py-2">
                    {v.integrityVerified
                      ? <span className="flex items-center gap-1 text-green-700"><CheckCircleIcon className="h-4 w-4" /> Verified</span>
                      : <span className="flex items-center gap-1 text-yellow-700"><ExclamationTriangleIcon className="h-4 w-4" /> Pending</span>
                    }
                  </td>
                  <td className="py-2 text-gray-500">{new Date(v.lastActivity).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
