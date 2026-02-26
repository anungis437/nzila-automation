/**
 * Zonga — Revenue Page (Server Component).
 *
 * Revenue dashboard: totals by source, recent events,
 * per-creator breakdown. Multi-currency aware for African markets.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card } from '@nzila/ui'
import { getRevenueOverview, getRevenueByCreator } from '@/lib/actions/revenue-actions'
import { formatCurrencyAmount } from '@/lib/stripe'

/** Format a dollar amount in the platform's base currency (USD). */
function formatUSD(n: number): string {
  return formatCurrencyAmount(Math.round(n * 100), 'USD')
}

export default async function RevenuePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [overview, byCreator] = await Promise.all([
    getRevenueOverview(),
    getRevenueByCreator(),
  ])

  const summaryCards = [
    { label: 'Total Revenue', value: formatUSD(overview.totalRevenue), icon: '💰', color: 'text-emerald-600' },
    { label: 'Streams', value: formatUSD(overview.streamRevenue), icon: '🎧', color: 'text-blue-600' },
    { label: 'Downloads', value: formatUSD(overview.downloadRevenue), icon: '⬇️', color: 'text-purple-600' },
    { label: 'Sync Licensing', value: formatUSD(overview.syncRevenue), icon: '🎬', color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Revenue</h1>
        <p className="text-gray-500 mt-1">
          {overview.eventCount.toLocaleString()} revenue events tracked
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{card.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Creator */}
        <div>
          <h2 className="text-lg font-semibold text-navy mb-3">Revenue by Creator</h2>
          {byCreator.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🎤</div>
                <p className="text-sm text-gray-500">No creator revenue data yet.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-gray-100">
                {byCreator.map((c) => (
                  <div key={c.creatorId} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-navy">{c.creatorName}</p>
                      <p className="text-xs text-gray-400">{c.events} events</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatUSD(Number(c.total))}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Recent Revenue Events */}
        <div>
          <h2 className="text-lg font-semibold text-navy mb-3">Recent Events</h2>
          {overview.recentEvents.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm text-gray-500">No revenue events yet.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-gray-100">
                {overview.recentEvents.map((event: { id: string; type?: string; amount?: number; assetTitle?: string; source?: string; createdAt?: string }, idx: number) => (
                  <div key={event.id ?? idx} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {event.type === 'stream' ? '🎧' : event.type === 'download' ? '⬇️' : '🎬'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {event.assetTitle ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {event.source ?? event.type} · {event.createdAt ? new Date(event.createdAt).toLocaleDateString('en-CA') : '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatUSD(Number(event.amount ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Revenue by Month */}
      {(() => {
        const monthlyData = ((overview as unknown as Record<string, unknown>).revenueByMonth as Array<{ month: string; amount: number }>) ?? []
        if (monthlyData.length === 0) return null
        return (
          <div>
            <h2 className="text-lg font-semibold text-navy mb-3">Monthly Revenue</h2>
            <Card>
              <div className="p-5">
                <div className="space-y-2">
                  {monthlyData.map((m) => (
                    <div key={m.month} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
                      <span className="text-sm font-medium text-navy">{m.month}</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatUSD(Number(m.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
