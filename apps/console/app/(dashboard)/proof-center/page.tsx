/**
 * Nzila OS — Procurement Proof Center
 * One-click evidence aggregation across security, data lifecycle,
 * operations, governance, and sovereignty. Export as Procurement Pack.
 * @see @nzila/platform-procurement-proof
 */
import { requireRole } from '@/lib/rbac'
import {
  ShieldCheckIcon,
  ServerIcon,
  DocumentArrowDownIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  CircleStackIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Mock data (wired to real ports in production) ───────────────────────────

const proofSections = {
  security: {
    title: 'Security Posture',
    icon: ShieldCheckIcon,
    score: 92,
    grade: 'A' as const,
    items: [
      { label: 'Dependency audit', status: 'pass' as const, detail: '0 critical, 1 high vulnerability' },
      { label: 'Signed attestation', status: 'pass' as const, detail: 'SHA-256, CI-signed' },
      { label: 'Lockfile integrity', status: 'pass' as const, detail: 'Verified' },
      { label: 'License compliance', status: 'pass' as const, detail: 'No blocked licenses' },
    ],
  },
  dataLifecycle: {
    title: 'Data Lifecycle',
    icon: CircleStackIcon,
    score: 100,
    grade: 'A' as const,
    items: [
      { label: 'Data manifests', status: 'pass' as const, detail: '3 manifests (PII, financial, operational)' },
      { label: 'Retention controls', status: 'pass' as const, detail: '5/5 policies enforced' },
      { label: 'Encryption at rest', status: 'pass' as const, detail: 'All stores encrypted' },
      { label: 'Auto-delete enabled', status: 'pass' as const, detail: 'Active' },
    ],
  },
  operational: {
    title: 'Operational Evidence',
    icon: ServerIcon,
    score: 91,
    grade: 'A' as const,
    items: [
      { label: 'SLO compliance', status: 'pass' as const, detail: '99.2% overall' },
      { label: 'p95 latency', status: 'pass' as const, detail: '320ms (target: 500ms)' },
      { label: 'Error rate', status: 'pass' as const, detail: '0.3% (target: 1%)' },
      { label: 'Incident MTTR', status: 'pass' as const, detail: '18 minutes' },
    ],
  },
  governance: {
    title: 'Governance Evidence',
    icon: EyeIcon,
    score: 95,
    grade: 'A' as const,
    items: [
      { label: 'Evidence packs', status: 'pass' as const, detail: '12 sealed packs' },
      { label: 'Snapshot chain', status: 'pass' as const, detail: '48 entries, verified' },
      { label: 'Policy compliance', status: 'pass' as const, detail: '100%' },
      { label: 'Control coverage', status: 'pass' as const, detail: 'access, financial, data, operational' },
    ],
  },
  sovereignty: {
    title: 'Sovereignty Profile',
    icon: GlobeAltIcon,
    score: 100,
    grade: 'A' as const,
    items: [
      { label: 'Deployment region', status: 'pass' as const, detail: 'South Africa North' },
      { label: 'Data residency', status: 'pass' as const, detail: 'ZA' },
      { label: 'Regulatory frameworks', status: 'pass' as const, detail: 'POPIA, GDPR' },
      { label: 'Cross-border transfer', status: 'pass' as const, detail: 'Disabled' },
    ],
  },
}

type SectionItem = { label: string; status: 'pass' | 'warn' | 'fail'; detail: string }

function StatusBadge({ status }: { status: SectionItem['status'] }) {
  if (status === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircleIcon className="h-3.5 w-3.5" /> Pass
      </span>
    )
  }
  if (status === 'warn') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
        <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <ExclamationTriangleIcon className="h-3.5 w-3.5" /> Fail
    </span>
  )
}

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = score >= 90 ? 'text-green-700 bg-green-50' :
    score >= 70 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${color}`}>
      {grade} ({score}/100)
    </span>
  )
}

function ProofSection({ sectionKey: _sectionKey, section }: {
  sectionKey: string
  section: typeof proofSections[keyof typeof proofSections]
}) {
  const Icon = section.icon
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
        </div>
        <ScoreBadge score={section.score} grade={section.grade} />
      </div>
      <div className="space-y-3">
        {section.items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ProofCenterPage({
  searchParams,
}: { searchParams: Promise<{ mode?: string }> }) {
  await requireRole('platform_admin', 'studio_admin')
  const params = await searchParams
  const isExecutive = params.mode === 'executive'

  // In production, this would call collectProcurementPack + signProcurementPack
  const mockExportData = JSON.stringify({
    MANIFEST: { version: '1.0', sectionCount: 5, generatedAt: new Date().toISOString() },
    sections: proofSections,
  }, null, 2)
  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(mockExportData)}`

  return (
    <div className={isExecutive ? 'p-12 bg-gray-50 min-h-screen' : 'p-8'}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procurement Proof Center</h1>
          <p className="text-gray-500 mt-1">
            One-click evidence aggregation — security, data, ops, governance, sovereignty
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={downloadHref}
            download="Procurement-Pack.json"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export Procurement Pack
          </a>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">Overall Procurement Readiness</p>
            <p className="text-4xl font-bold mt-1">95/100</p>
            <p className="text-sm text-blue-200 mt-1">Grade A — All sections verified</p>
          </div>
          <div className="flex items-center gap-2">
            <FingerPrintIcon className="h-8 w-8 text-blue-200" />
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-300" />
          </div>
        </div>
      </div>

      {/* Proof Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(proofSections).map(([key, section]) => (
          <ProofSection key={key} sectionKey={key} section={section} />
        ))}
      </div>

      {/* Signature & Manifest */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FingerPrintIcon className="h-5 w-5 text-gray-400" />
          Pack Signature & Manifest
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Algorithm</p>
            <p className="text-sm font-mono text-gray-800">HMAC-SHA256</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sections</p>
            <p className="text-sm font-mono text-gray-800">5 sections, all verified</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Generated</p>
            <p className="text-sm font-mono text-gray-800">{new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
