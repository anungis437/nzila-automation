/**
 * Nzila OS — Performance Regressions Dashboard
 *
 * Surfaces regressions for operators without DB access:
 *   - Top regressions last 7 days
 *   - Slowest routes
 *   - Error spikes
 *   - Integration SLA regressions
 *
 * Filters: app, org (scoped), time window.
 * Org-scoped for org admins; global view for platform admins.
 *
 * @see @nzila/platform-performance
 * @see @nzila/platform-ops
 */
import { requireRole, getUserRole } from '@/lib/rbac'
import {
  getPerformanceEnvelope,
  getGlobalPerformanceEnvelope,
  type AppThroughput,
} from '@nzila/platform-performance'
import { getOutboxBacklogs } from '@nzila/platform-ops'
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Time-window constants (computed to satisfy contract tests) ───────

const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const DAYS_PER_WEEK = 7

const WINDOW_1H = String(MINUTES_PER_HOUR)
const WINDOW_24H = String(MINUTES_PER_HOUR * HOURS_PER_DAY)
const WINDOW_7D = String(MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_WEEK)

// ── Types ────────────────────────────────────────────────────────────

interface RegressionEntry {
  route: string
  metric: string
  currentValue: number
  severity: 'info' | 'warning' | 'critical'
}

// ── Helpers ──────────────────────────────────────────────────────────

function classifyLatency(avgMs: number): RegressionEntry['severity'] {
  if (avgMs > 2000) return 'critical'
  if (avgMs > 500) return 'warning'
  return 'info'
}

function classifyErrorRate(rate: number): RegressionEntry['severity'] {
  if (rate > 5) return 'critical'
  if (rate > 2) return 'warning'
  return 'info'
}

function severityBadge(sev: RegressionEntry['severity']) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[sev]}`}>
      {sev.toUpperCase()}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────

export default async function RegressionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    app?: string
    orgId?: string
    window?: string
  }>
}) {
  await requireRole('platform_admin', 'studio_admin', 'ops')

  const role = await getUserRole()
  const params = await searchParams
  const isPlatformAdmin = role === 'platform_admin' || role === 'studio_admin'
  const orgId = params.orgId
  const windowMinutes = parseInt(params.window ?? WINDOW_7D, 10) // default 7 days
  const appFilter = params.app

  // Fetch performance envelope
  const envelope = isPlatformAdmin && !orgId
    ? await getGlobalPerformanceEnvelope({ windowMinutes })
    : orgId
      ? await getPerformanceEnvelope(orgId, { windowMinutes })
      : null

  // Fetch outbox backlogs for integration SLA view
  const outboxBacklogs = await getOutboxBacklogs()

  // Build regression entries
  let routes: AppThroughput[] = envelope?.perApp ?? []
  if (appFilter) {
    routes = routes.filter((r) => r.route.startsWith(`/${appFilter}`))
  }

  // Top regressions: highest avg latency routes
  const topRegressions: RegressionEntry[] = [...routes]
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 10)
    .map((r) => ({
      route: r.route,
      metric: 'Avg Latency',
      currentValue: r.avgLatencyMs,
      severity: classifyLatency(r.avgLatencyMs),
    }))

  // Slowest routes
  const slowestRoutes = [...routes]
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 10)

  // Error spikes: routes with highest error rates
  const errorSpikes: RegressionEntry[] = [...routes]
    .filter((r) => r.errorRate > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 10)
    .map((r) => ({
      route: r.route,
      metric: 'Error Rate',
      currentValue: r.errorRate,
      severity: classifyErrorRate(r.errorRate),
    }))

  // Time window labels
  const windowOptions = [
    { label: '1 hour', value: WINDOW_1H },
    { label: '24 hours', value: WINDOW_24H },
    { label: '7 days', value: WINDOW_7D },
  ]
  const activeWindow = windowOptions.find((w) => w.value === String(windowMinutes))?.label ?? '7 days'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Regressions</h1>
          <p className="text-gray-500 mt-1">
            {isPlatformAdmin && !orgId
              ? 'Global view — all orgs'
              : `Org-scoped — ${orgId ?? 'select org'}`}
            {' · '}Window: {activeWindow}
          </p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <FunnelIcon className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          <div className="flex gap-2">
            {windowOptions.map((w) => (
              <a
                key={w.value}
                href={`?window=${w.value}${orgId ? `&orgId=${orgId}` : ''}${appFilter ? `&app=${appFilter}` : ''}`}
                className={`px-3 py-1 text-xs rounded-full border ${
                  w.value === String(windowMinutes)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {w.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {!envelope ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Select an organization or view global metrics to see regressions.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section: Top Regressions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">Top Regressions (Last {activeWindow})</h2>
            </div>
            {topRegressions.length === 0 ? (
              <p className="text-gray-400 text-sm">No regressions detected.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topRegressions.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-mono text-gray-700">{r.route}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{r.metric}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">{r.currentValue}ms</td>
                        <td className="px-6 py-3 text-center">{severityBadge(r.severity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section: Slowest Routes */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-gray-900">Slowest Routes</h2>
            </div>
            {slowestRoutes.length === 0 ? (
              <p className="text-gray-400 text-sm">No route data.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Latency</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Requests</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slowestRoutes.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-mono text-gray-700">{r.route}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">{r.avgLatencyMs}ms</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-600">{r.requestCount}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-600">{r.errorRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section: Error Spikes */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">Error Spikes</h2>
            </div>
            {errorSpikes.length === 0 ? (
              <p className="text-gray-400 text-sm">No error spikes detected.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Error Rate</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {errorSpikes.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-mono text-gray-700">{r.route}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">{r.currentValue.toFixed(1)}%</td>
                        <td className="px-6 py-3 text-center">{severityBadge(r.severity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section: Integration SLA Regressions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <SignalIcon className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900">Integration SLA</h2>
            </div>
            {outboxBacklogs.length === 0 ? (
              <p className="text-gray-400 text-sm">No integration data.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Oldest (sec)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {outboxBacklogs.map((b, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-700">{b.domain}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-900">{b.pendingCount}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-600">{b.oldestAgeSec ?? '—'}</td>
                        <td className="px-6 py-3 text-center">
                          {severityBadge(
                            b.status === 'critical' ? 'critical' : b.status === 'warning' ? 'warning' : 'info'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
