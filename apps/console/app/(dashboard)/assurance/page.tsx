/**
 * Nzila OS — Executive Assurance Dashboard
 * 5 KPI scores: compliance, security, ops, cost, integration reliability.
 * Weighted overall score with letter grades.
 * @see @nzila/platform-assurance
 */
import { requireRole } from '@/lib/rbac'
import { gradeFromScore } from '@nzila/platform-assurance'
import type { PolicyEvaluationOutput } from '@nzila/platform-policy-engine'
import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Mock dashboard data (wired to real scorer in production) ─────────────

interface KpiScore {
  name: string
  value: number
  grade: string
  weight: number
  trend: 'up' | 'down' | 'flat'
  details: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const kpis: KpiScore[] = [
  {
    name: 'Compliance',
    value: 97,
    grade: 'A',
    weight: 25,
    trend: 'up',
    details: '12 evidence packs sealed, 48-entry snapshot chain, 100% policy compliance',
    icon: DocumentCheckIcon,
  },
  {
    name: 'Security',
    value: 92,
    grade: 'A',
    weight: 25,
    trend: 'up',
    details: '0 critical CVEs, signed attestations, lockfile integrity verified',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Operations',
    value: 91,
    grade: 'A',
    weight: 20,
    trend: 'flat',
    details: '99.2% SLO compliance, p95=320ms, error rate 0.3%, MTTR 18m',
    icon: CpuChipIcon,
  },
  {
    name: 'Cost',
    value: 78,
    grade: 'B',
    weight: 15,
    trend: 'down',
    details: 'Monthly spend $4,200 (budget $5,000), 84% utilization, no anomalies',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Integration Reliability',
    value: 95,
    grade: 'A',
    weight: 15,
    trend: 'up',
    details: '3 providers active, 99.7% uptime, mean reconnect 12s',
    icon: ArrowPathIcon,
  },
]

const overallScore = Math.round(
  kpis.reduce((sum, kpi) => sum + kpi.value * (kpi.weight / 100), 0),
)

function TrendIcon({ trend }: { trend: KpiScore['trend'] }) {
  if (trend === 'up') return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
  if (trend === 'down') return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
  return <MinusIcon className="h-4 w-4 text-gray-400" />
}

function gradeColor(grade: string): string {
  if (grade === 'A') return 'bg-green-50 text-green-700 border-green-200'
  if (grade === 'B') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  if (grade === 'C') return 'bg-orange-50 text-orange-700 border-orange-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

// Use gradeFromScore from @nzila/platform-assurance for consistency
const overallGrade = gradeFromScore

// Type used by policy evaluation results rendered in the assurance dashboard
export type { PolicyEvaluationOutput as AssurancePolicyOutput }

function KpiCard({ kpi }: { kpi: KpiScore }) {
  const Icon = kpi.icon
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{kpi.name}</h3>
            <p className="text-xs text-gray-500">Weight: {kpi.weight}%</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${gradeColor(kpi.grade)}`}>
          {kpi.grade}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
          <TrendIcon trend={kpi.trend} />
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${kpi.value >= 90 ? 'bg-green-500' : kpi.value >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${kpi.value}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{kpi.details}</p>
    </div>
  )
}

export default async function AssurancePage({
  searchParams,
}: { searchParams: Promise<{ mode?: string }> }) {
  await requireRole('platform_admin', 'studio_admin', 'analyst')
  const params = await searchParams
  const isExecutive = params.mode === 'executive'

  const grade = overallGrade(overallScore)

  return (
    <div className={isExecutive ? 'p-12 bg-gray-50 min-h-screen' : 'p-8'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Executive Assurance Dashboard</h1>
        <p className="text-gray-500 mt-1">Weighted KPI scores across compliance, security, operations, cost, and integration reliability</p>
      </div>

      {/* Overall Score Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">Overall Assurance Score</p>
            <p className="text-5xl font-bold mt-2">{overallScore}/100</p>
            <p className="text-sm text-indigo-200 mt-2">
              Grade {grade} — Weighted across 5 dimensions
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-4 py-2 text-2xl font-bold rounded-xl ${grade === 'A' ? 'bg-green-500/20 text-green-200' : grade === 'B' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}`}>
              {grade}
            </span>
            <p className="text-xs text-indigo-300 mt-2">
              Compliance 25% · Security 25% · Ops 20% · Cost 15% · Integration 15%
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.name} kpi={kpi} />
        ))}
      </div>

      {/* Trend Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trend Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="flex items-center gap-2 py-2">
              <TrendIcon trend={kpi.trend} />
              <span className="text-sm text-gray-700">{kpi.name}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {kpi.trend === 'up' ? '↑ improving' : kpi.trend === 'down' ? '↓ declining' : '— stable'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
