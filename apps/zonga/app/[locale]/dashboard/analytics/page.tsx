/**
 * Zonga — Analytics Page (Server Component).
 *
 * Platform-wide analytics: streams, downloads, top assets, monthly revenue.
 * Multi-currency aware for African markets.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card } from '@nzila/ui'
import { getAnalyticsOverview } from '@/lib/actions/release-actions'
import { formatCurrencyAmount } from '@/lib/stripe'

function formatUSD(n: number): string {
  return formatCurrencyAmount(Math.round(n * 100), 'USD')
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en').format(n)
}

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const analytics = await getAnalyticsOverview()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Analytics</h1>
        <p className="text-gray-500 mt-1">Platform performance &amp; content metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎧</span>
              <p className="text-xs text-gray-500">Total Streams</p>
            </div>
            <p className="text-2xl font-bold text-navy">
              {formatNumber(analytics.totalStreams ?? 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⬇️</span>
              <p className="text-xs text-gray-500">Total Downloads</p>
            </div>
            <p className="text-2xl font-bold text-navy">
              {formatNumber(analytics.totalDownloads ?? 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💰</span>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatUSD((analytics.revenueByMonth ?? []).reduce((s, m) => s + m.amount, 0))}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">👤</span>
              <p className="text-xs text-gray-500">Unique Listeners</p>
            </div>
            <p className="text-2xl font-bold text-navy">
              {formatNumber(analytics.uniqueListeners ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Top Assets */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">🏆 Top Assets</h2>
        {(analytics.topAssets ?? []).length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No asset data available yet.</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500">#</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500">Asset</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500">Streams</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analytics.topAssets.map((a, i) => (
                    <tr key={a.assetId} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-navy">{a.title ?? 'Untitled'}</td>
                      <td className="px-5 py-3">{formatNumber(a.streams ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Monthly Revenue */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">📊 Monthly Revenue</h2>
        {(analytics.revenueByMonth ?? []).length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No monthly revenue data yet.</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-5 space-y-3">
              {analytics.revenueByMonth.map((m: { month: string; amount: number }) => {
                const max = Math.max(
                  ...analytics.revenueByMonth.map((mr: { amount: number }) => mr.amount),
                  1,
                )
                const width = (m.amount / max) * 100
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-gray-500 font-mono shrink-0">
                      {m.month}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-electric rounded-full transition-all"
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-xs font-semibold text-navy shrink-0">
                      {formatUSD(m.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
