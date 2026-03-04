/**
 * Nzila OS — Console: Evidence Packs Dashboard
 *
 * Browse and inspect evidence packs across all orgs:
 *   - Pack status lifecycle (draft → sealed → verified → exported)
 *   - Cryptographic seal integrity
 *   - Retention class tracking
 *   - Artifact counts and export controls
 *
 * @see @nzila/platform-evidence-pack
 */
import { requireRole } from '@/lib/rbac'
import type { EvidencePackIndex as _EvidencePackIndex } from '@nzila/platform-evidence-pack'
import {
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Placeholder data ───────────────────────────────────────────────────────

type PackStatus = 'draft' | 'sealed' | 'verified' | 'exported' | 'expired'
type RetentionClass = 'standard' | 'extended' | 'regulatory' | 'permanent'

interface PackRow {
  packId: string
  orgId: string
  title: string
  status: PackStatus
  retentionClass: RetentionClass
  artifactCount: number
  createdAt: string
  sealedAt: string | null
}

function loadPacks(): PackRow[] {
  return [
    { packId: 'evp_001', orgId: 'org_acme', title: 'Q4-2025 SOC 2 Evidence', status: 'verified', retentionClass: 'regulatory', artifactCount: 47, createdAt: '2025-12-31T10:00:00Z', sealedAt: '2026-01-02T14:00:00Z' },
    { packId: 'evp_002', orgId: 'org_acme', title: 'ISO 27001 Audit Pack', status: 'sealed', retentionClass: 'regulatory', artifactCount: 62, createdAt: '2026-01-15T09:00:00Z', sealedAt: '2026-01-15T16:00:00Z' },
    { packId: 'evp_003', orgId: 'org_acme', title: 'Monthly Ops Evidence — Feb 2026', status: 'exported', retentionClass: 'standard', artifactCount: 23, createdAt: '2026-02-28T12:00:00Z', sealedAt: '2026-02-28T18:00:00Z' },
    { packId: 'evp_004', orgId: 'org_beta', title: 'Pilot Deployment Pack', status: 'draft', retentionClass: 'standard', artifactCount: 8, createdAt: '2026-03-01T10:00:00Z', sealedAt: null },
    { packId: 'evp_005', orgId: 'org_beta', title: 'DR/BCP Certification Pack', status: 'verified', retentionClass: 'extended', artifactCount: 31, createdAt: '2026-02-15T08:00:00Z', sealedAt: '2026-02-16T11:00:00Z' },
    { packId: 'evp_006', orgId: 'org_acme', title: 'Q3-2025 Evidence Archive', status: 'expired', retentionClass: 'standard', artifactCount: 35, createdAt: '2025-09-30T10:00:00Z', sealedAt: '2025-10-01T09:00:00Z' },
  ]
}

// ── UI Helpers ─────────────────────────────────────────────────────────────

const statusConfig: Record<PackStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  sealed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sealed' },
  verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
  exported: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Exported' },
  expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
}

const retentionConfig: Record<RetentionClass, { label: string; days: string }> = {
  standard: { label: 'Standard', days: '365 d' },
  extended: { label: 'Extended', days: '3 yr' },
  regulatory: { label: 'Regulatory', days: '7 yr' },
  permanent: { label: 'Permanent', days: '∞' },
}

function StatusBadge({ status }: { status: PackStatus }) {
  const c = statusConfig[status]
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
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

export default async function EvidencePacksPage() {
  await requireRole('platform_admin', 'studio_admin', 'ops')

  const packs = loadPacks()
  const sealed = packs.filter((p) => p.status === 'sealed' || p.status === 'verified' || p.status === 'exported').length
  const totalArtifacts = packs.reduce((sum, p) => sum + p.artifactCount, 0)
  const regulatory = packs.filter((p) => p.retentionClass === 'regulatory').length

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Evidence Packs</h1>
        <p className="text-gray-500 mt-1">Cryptographically sealed evidence packs with lifecycle tracking</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Total Packs" value={String(packs.length)} icon={ArchiveBoxIcon} accent="text-blue-600" />
        <MetricCard title="Sealed / Verified" value={String(sealed)} icon={LockClosedIcon} accent="text-green-600" />
        <MetricCard title="Total Artifacts" value={String(totalArtifacts)} icon={DocumentArrowDownIcon} accent="text-gray-600" />
        <MetricCard title="Regulatory Packs" value={String(regulatory)} icon={ShieldCheckIcon} accent="text-purple-600" />
      </div>

      {/* Evidence Packs Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
          All Evidence Packs
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Pack ID</th>
              <th className="text-left py-2 text-gray-500 font-medium">Title</th>
              <th className="text-left py-2 text-gray-500 font-medium">Org</th>
              <th className="text-left py-2 text-gray-500 font-medium">Status</th>
              <th className="text-left py-2 text-gray-500 font-medium">Retention</th>
              <th className="text-left py-2 text-gray-500 font-medium">Artifacts</th>
              <th className="text-left py-2 text-gray-500 font-medium">Created</th>
              <th className="text-left py-2 text-gray-500 font-medium">Sealed</th>
            </tr>
          </thead>
          <tbody>
            {packs.map((p, i) => (
              <tr key={p.packId} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="py-2 font-mono text-gray-600 text-xs">{p.packId}</td>
                <td className="py-2 font-medium text-gray-900">{p.title}</td>
                <td className="py-2 text-gray-600">{p.orgId}</td>
                <td className="py-2"><StatusBadge status={p.status} /></td>
                <td className="py-2">
                  <span className="text-gray-700 text-xs">{retentionConfig[p.retentionClass].label}</span>
                  <span className="text-gray-400 text-xs ml-1">({retentionConfig[p.retentionClass].days})</span>
                </td>
                <td className="py-2 text-gray-700">{p.artifactCount}</td>
                <td className="py-2 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="py-2 text-gray-500">
                  {p.sealedAt
                    ? <span className="flex items-center gap-1"><CheckCircleIcon className="h-4 w-4 text-green-600" />{new Date(p.sealedAt).toLocaleDateString()}</span>
                    : <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4 text-gray-400" /> Pending</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
