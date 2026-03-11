/**
 * Nzila OS — Console: Evidence Packs Dashboard
 *
 * Browse and inspect evidence packs across all orgs:
 *   - Real data from the evidencePacks database table
 *   - Pack status lifecycle (draft → sealed → verified → expired)
 *   - Cryptographic chain integrity verification
 *   - Artifact counts and JSON export
 *
 * @see @nzila/platform-evidence-pack
 */
import { requireRole } from '@/lib/rbac'
import { platformDb } from '@nzila/db/platform'
import { evidencePacks as evidencePacksTable } from '@nzila/db/schema'
import { desc } from 'drizzle-orm'
import {
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── UI Helpers ─────────────────────────────────────────────────────────────

type PackStatus = 'draft' | 'sealed' | 'verified' | 'expired'

const statusConfig: Record<PackStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  sealed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sealed' },
  verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
  expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
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

  const packs = await platformDb
    .select()
    .from(evidencePacksTable)
    .orderBy(desc(evidencePacksTable.createdAt))

  const sealed = packs.filter((p) => p.status === 'sealed' || p.status === 'verified').length
  const totalArtifacts = packs.reduce((sum, p) => sum + p.artifactCount, 0)
  const integrityVerified = packs.filter((p) => p.chainIntegrity === 'VERIFIED').length

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evidence Packs</h1>
          <p className="text-gray-500 mt-1">Cryptographically sealed evidence packs with lifecycle tracking</p>
        </div>
        <a
          href="/api/evidence-packs?download=true"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Export JSON
        </a>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Total Packs" value={String(packs.length)} icon={ArchiveBoxIcon} accent="text-blue-600" />
        <MetricCard title="Sealed / Verified" value={String(sealed)} icon={LockClosedIcon} accent="text-green-600" />
        <MetricCard title="Total Artifacts" value={String(totalArtifacts)} icon={DocumentArrowDownIcon} accent="text-gray-600" />
        <MetricCard title="Chain Verified" value={String(integrityVerified)} icon={ShieldCheckIcon} accent="text-purple-600" />
      </div>

      {/* Evidence Packs Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
          All Evidence Packs
        </h2>
        {packs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No evidence packs yet</p>
            <p className="text-sm mt-1">Evidence packs appear here as compliance activities generate sealed artifacts.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Pack ID</th>
                <th className="text-left py-2 text-gray-500 font-medium">Summary</th>
                <th className="text-left py-2 text-gray-500 font-medium">Control Family</th>
                <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 text-gray-500 font-medium">Artifacts</th>
                <th className="text-left py-2 text-gray-500 font-medium">Integrity</th>
                <th className="text-left py-2 text-gray-500 font-medium">Created</th>
                <th className="text-left py-2 text-gray-500 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 font-mono text-gray-600 text-xs">{p.packId}</td>
                  <td className="py-2 font-medium text-gray-900 max-w-xs truncate">{p.summary ?? '—'}</td>
                  <td className="py-2 text-gray-600 text-xs">{p.controlFamily}</td>
                  <td className="py-2"><StatusBadge status={p.status} /></td>
                  <td className="py-2 text-gray-700">{p.artifactCount}</td>
                  <td className="py-2">
                    {p.chainIntegrity === 'VERIFIED'
                      ? <span className="flex items-center gap-1 text-green-700"><CheckCircleIcon className="h-4 w-4" /> Verified</span>
                      : <span className="flex items-center gap-1 text-gray-400"><ClockIcon className="h-4 w-4" /> {p.chainIntegrity}</span>
                    }
                  </td>
                  <td className="py-2 text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="py-2 text-gray-500">
                    {p.verifiedAt
                      ? <span className="flex items-center gap-1"><CheckCircleIcon className="h-4 w-4 text-green-600" />{new Date(p.verifiedAt).toLocaleDateString()}</span>
                      : <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4 text-gray-400" /> Pending</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
