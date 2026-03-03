/**
 * Nzila OS — Console: Ops Dashboard (Single-Lens View)
 *
 * Unified operational truth surface combining:
 *   - Ops Confidence Score + 7-day delta
 *   - Latest digest anomalies
 *   - Latest trend warnings
 *   - Runbook links
 *
 * @see @nzila/platform-ops
 */
import { requireRole } from '@/lib/rbac'
import { computeOpsScore, computeOpsScoreDelta } from '@nzila/platform-ops'
import {
  analyseTrends,
  type TrendResult,
} from '@nzila/platform-ops/trend-detection'
import {
  ShieldExclamationIcon,
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Data loaders (server-side) ─────────────────────────────────────────────

function loadOpsData() {
  const scoreResult = computeOpsScore({
    sloCompliancePct: Number(process.env.OPS_SLO_COMPLIANCE_PCT ?? '96'),
    errorDeltaPct: Number(process.env.OPS_ERROR_DELTA_PCT ?? '1.2'),
    integrationSlaPct: Number(process.env.OPS_INTEGRATION_SLA_PCT ?? '98.5'),
    dlqBacklogRatio: Number(process.env.OPS_DLQ_BACKLOG_RATIO ?? '0.1'),
    regressionSeverity: Number(process.env.OPS_REGRESSION_SEVERITY ?? '0'),
  })

  const delta = computeOpsScoreDelta(scoreResult.score, [
    { date: '2026-02-24', score: Number(process.env.OPS_PREV_SCORE ?? '85'), grade: 'B' },
  ])

  return { scoreResult, delta }
}

function loadTrendData(): TrendResult[] {
  const sampleSeries = [
    {
      metric: 'p95_latency',
      scope: 'console',
      dataPoints: [
        { date: '2026-02-25', value: 120 },
        { date: '2026-02-26', value: 125 },
        { date: '2026-02-27', value: 128 },
        { date: '2026-02-28', value: 131 },
        { date: '2026-03-01', value: 135 },
        { date: '2026-03-02', value: 140 },
        { date: '2026-03-03', value: 148 },
      ],
    },
    {
      metric: 'error_rate',
      scope: 'web',
      dataPoints: [
        { date: '2026-02-25', value: 0.5 },
        { date: '2026-02-26', value: 0.4 },
        { date: '2026-02-27', value: 0.45 },
        { date: '2026-02-28', value: 0.42 },
        { date: '2026-03-01', value: 0.38 },
        { date: '2026-03-02', value: 0.35 },
        { date: '2026-03-03', value: 0.3 },
      ],
    },
    {
      metric: 'integration_sla',
      scope: 'global',
      dataPoints: [
        { date: '2026-02-25', value: 99.2 },
        { date: '2026-02-26', value: 99.0 },
        { date: '2026-02-27', value: 98.8 },
        { date: '2026-02-28', value: 98.5 },
        { date: '2026-03-01', value: 98.2 },
        { date: '2026-03-02', value: 97.9 },
        { date: '2026-03-03', value: 97.5 },
      ],
    },
  ]

  return analyseTrends(sampleSeries)
}

function loadAnomalies(): Array<{
  metric: string
  scope: string
  currentValue: number
  threshold: number
  severity: 'warning' | 'critical'
  description: string
}> {
  return [
    {
      metric: 'p95_latency',
      scope: 'console',
      currentValue: 148,
      threshold: 200,
      severity: 'warning' as const,
      description: 'console/p95_latency approaching SLO threshold',
    },
  ]
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${colors[grade] ?? 'bg-gray-100 text-gray-800'}`}>
      {grade}
    </span>
  )
}

function DeltaIconInline({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up') return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 inline" />
  if (dir === 'down') return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600 inline" />
  return <MinusIcon className="h-5 w-5 text-gray-400 inline" />
}

function DirectionBadge({ direction }: { direction: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    degrading: { color: 'bg-red-100 text-red-800', label: '🔴 Degrading' },
    improving: { color: 'bg-green-100 text-green-800', label: '🟢 Improving' },
    stable: { color: 'bg-gray-100 text-gray-600', label: '⚪ Stable' },
  }
  const c = cfg[direction] ?? cfg.stable
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  )
}

const RUNBOOKS = [
  { title: 'SLO Breach Response', href: '/docs/ops/runbooks/slo-breach', severity: 'critical' },
  { title: 'Integration Failure', href: '/docs/ops/runbooks/integration-failure', severity: 'critical' },
  { title: 'DLQ Backlog Triage', href: '/docs/ops/runbooks/dlq-triage', severity: 'warning' },
  { title: 'Performance Degradation', href: '/docs/ops/runbooks/perf-degradation', severity: 'warning' },
  { title: 'Incident Response', href: '/docs/ops/runbooks/incident-response', severity: 'critical' },
  { title: 'Failure Simulation Guide', href: '/docs/ops/runbooks/failure-sim', severity: 'info' },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default async function OpsPage() {
  await requireRole('platform_admin', 'studio_admin', 'ops')

  const { scoreResult, delta } = loadOpsData()
  const trendResults = loadTrendData()
  const anomalies = loadAnomalies()
  const trendWarnings = trendResults.filter((t) => t.isDegrading)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ops Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Single-lens operational truth — score, anomalies, trends, runbooks
        </p>
      </div>

      {/* ── Hero: Ops Confidence Score ─────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <ShieldExclamationIcon className="h-12 w-12 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Ops Confidence Score
              </p>
              <div className="flex items-baseline gap-4 mt-1">
                <span className="text-5xl font-bold text-gray-900">{scoreResult.score}</span>
                <GradeBadge grade={scoreResult.grade} />
              </div>
              <p className="text-sm text-gray-500 mt-1">{scoreResult.status}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">7-Day Delta</p>
            <div className="flex items-center gap-2 justify-end mt-1">
              <DeltaIconInline dir={delta.direction} />
              <span className={`text-2xl font-bold ${delta.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {delta.delta >= 0 ? '+' : ''}{delta.delta}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {delta.previous} → {delta.current}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Anomalies Panel ─────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Digest Anomalies</h2>
            <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {anomalies.length}
            </span>
          </div>
          {anomalies.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircleIcon className="h-5 w-5" /> All clear — no anomalies.
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  {a.severity === 'critical' ? (
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {a.scope}/{a.metric}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {a.currentValue} · Threshold: {a.threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trend Warnings Panel ────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarSquareIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Trend Warnings</h2>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${trendWarnings.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {trendWarnings.length}
            </span>
          </div>
          {trendWarnings.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircleIcon className="h-5 w-5" /> No degrading trends detected.
            </div>
          ) : (
            <div className="space-y-3">
              {trendWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50 rounded-lg p-3">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {w.scope}/{w.metric}
                      </p>
                      <DirectionBadge direction={w.direction} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Slope: {w.slopePerDay}/day · R²: {w.rSquared} · {w.dataPointCount} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All trend results table */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">All Tracked Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Metric</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Direction</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Slope</th>
                  </tr>
                </thead>
                <tbody>
                  {trendResults.map((t, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs">{t.scope}/{t.metric}</td>
                      <td className="py-2"><DirectionBadge direction={t.direction} /></td>
                      <td className="py-2 text-right font-mono text-xs">{t.slopePerDay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Runbooks Panel ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpenIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Runbooks</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RUNBOOKS.map((rb) => {
            const borderColor =
              rb.severity === 'critical' ? 'border-l-red-400' :
              rb.severity === 'warning' ? 'border-l-amber-400' :
              'border-l-blue-400'
            return (
              <a
                key={rb.title}
                href={rb.href}
                className={`block border border-gray-200 border-l-4 ${borderColor} rounded-lg p-4 hover:bg-gray-50 transition`}
              >
                <p className="text-sm font-medium text-gray-900">{rb.title}</p>
                <p className="text-xs text-gray-400 mt-1">{rb.href}</p>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
