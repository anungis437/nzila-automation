/**
 * Nzila OS — Console: Cost Dashboard
 *
 * Org-scoped cost observability: spend over time, top cost drivers,
 * cost per request estimate, and projected monthly burn.
 */
import { requireRole, getUserRole } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

interface CostRollup {
  orgId: string
  appId: string
  category: string
  day: string
  totalUnits: number
  totalEstCostUsd: number
  eventCount: number
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  )
}

function BudgetStateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    exceeded: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[state] ?? colors.ok}`}>
      {state.toUpperCase()}
    </span>
  )
}

export default async function CostDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; orgId?: string }>
}) {
  const role = await requireRole('platform_admin', 'studio_admin', 'ops')
  const params = await searchParams
  const isPlatformAdmin = role === 'platform_admin' || role === 'studio_admin'
  const isGlobalView = isPlatformAdmin && params.mode === 'global'

  // ── Mock data for server component (replaced by real DB queries in production) ──
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  // Deterministic placeholder data (seeded from day index)
  const dailyTrend = last30.map((day, i) => ({
    day,
    totalEstCostUsd: Math.round((8 + ((i * 7 + 3) % 13)) * 100) / 100,
  }))

  const totalSpend = dailyTrend.reduce((s, d) => s + d.totalEstCostUsd, 0)
  const last7Avg = dailyTrend.slice(-7).reduce((s, d) => s + d.totalEstCostUsd, 0) / 7
  const projected30 = Math.round(last7Avg * 30 * 100) / 100
  const costPerRequest = Math.round((totalSpend / 45000) * 10000) / 10000

  const topDrivers = [
    { appId: 'web', category: 'compute_ms', totalEstCostUsd: totalSpend * 0.35 },
    { appId: 'console', category: 'db_query_ms', totalEstCostUsd: totalSpend * 0.25 },
    { appId: 'orchestrator-api', category: 'integration_call', totalEstCostUsd: totalSpend * 0.2 },
    { appId: 'web', category: 'egress_kb', totalEstCostUsd: totalSpend * 0.12 },
    { appId: 'cora', category: 'ai_token', totalEstCostUsd: totalSpend * 0.08 },
  ]

  const budgetState = totalSpend > 400 ? 'exceeded' : totalSpend > 320 ? 'warning' : 'ok'

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Cost Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isGlobalView ? 'Global platform cost overview' : 'Org-scoped cost observability'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BudgetStateBadge state={budgetState} />
          {isPlatformAdmin && (
            <a
              href={isGlobalView ? '/cost' : '/cost?mode=global'}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {isGlobalView ? 'View org scope' : 'View global'}
            </a>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Spend (30d)"
          value={`$${totalSpend.toFixed(2)}`}
          sub={`${dailyTrend.length} days tracked`}
        />
        <MetricCard
          label="Projected Monthly Burn"
          value={`$${projected30.toFixed(2)}`}
          sub={`Based on last 7-day avg ($${last7Avg.toFixed(2)}/day)`}
        />
        <MetricCard
          label="Cost per Request"
          value={`$${costPerRequest.toFixed(4)}`}
          sub="Estimated avg across all routes"
        />
        <MetricCard
          label="Budget State"
          value={budgetState.toUpperCase()}
          sub={budgetState === 'exceeded' ? 'Non-critical routes may be blocked' : 'Within budget'}
        />
      </div>

      {/* ── Daily Spend Trend ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Daily Spend Trend
        </h2>
        <div className="flex h-40 items-end gap-1">
          {dailyTrend.map((d) => {
            const maxVal = Math.max(...dailyTrend.map((t) => t.totalEstCostUsd))
            const height = maxVal > 0 ? (d.totalEstCostUsd / maxVal) * 100 : 0
            return (
              <div
                key={d.day}
                className="flex-1 rounded-t bg-blue-500 transition-all hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-300"
                style={{ height: `${height}%` }}
                title={`${d.day}: $${d.totalEstCostUsd.toFixed(2)}`}
              />
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-400">
          <span>{last30[0]}</span>
          <span>{today}</span>
        </div>
      </div>

      {/* ── Top Cost Drivers ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Top Cost Drivers
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="pb-2 font-medium text-zinc-500">App</th>
              <th className="pb-2 font-medium text-zinc-500">Category</th>
              <th className="pb-2 text-right font-medium text-zinc-500">Est. Cost (USD)</th>
              <th className="pb-2 text-right font-medium text-zinc-500">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {topDrivers.map((d, i) => (
              <tr
                key={i}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-2 text-zinc-900 dark:text-zinc-100">{d.appId}</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{d.category}</td>
                <td className="py-2 text-right text-zinc-900 dark:text-zinc-100">
                  ${d.totalEstCostUsd.toFixed(2)}
                </td>
                <td className="py-2 text-right text-zinc-500">
                  {((d.totalEstCostUsd / totalSpend) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Budget Policy ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Budget Policy
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Daily Budget</p>
            <p className="font-mono text-zinc-900 dark:text-zinc-100">$500.00</p>
          </div>
          <div>
            <p className="text-zinc-500">Monthly Budget</p>
            <p className="font-mono text-zinc-900 dark:text-zinc-100">$15,000.00</p>
          </div>
          <div>
            <p className="text-zinc-500">Daily Utilization</p>
            <p className="font-mono text-zinc-900 dark:text-zinc-100">
              {((last7Avg / 500) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Last Breach</p>
            <p className="font-mono text-zinc-900 dark:text-zinc-100">
              {budgetState === 'exceeded' ? today : 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
