/**
 * Dashboard Home — Overview for Zonga: catalog summary,
 * revenue snapshot, quick actions, recent activity.
 *
 * Server component that queries real data from @nzila/db.
 * Uses @nzila/zonga-core types for domain modeling and @nzila/ui for layout.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card } from '@nzila/ui'
import type { CreatorStatus, AssetStatus, ReleaseStatus } from '@nzila/zonga-core'

// ── Data fetching ───────────────────────────────────────────────────────────

interface DashboardStats {
  totalTracks: number | null
  totalRevenue: number | null
  activeReleases: number | null
  walletBalance: number | null
}

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { db } = await import('@nzila/db')
    const { sql } = await import('drizzle-orm')

    const [tracksResult, revenueResult, releasesResult] = await Promise.allSettled([
      db.execute(sql`SELECT COUNT(*) as count FROM content_assets WHERE status = 'published'`),
      db.execute(sql`SELECT COALESCE(SUM(amount), 0) as total FROM revenue_events`),
      db.execute(sql`SELECT COUNT(*) as count FROM releases WHERE status = 'published'`),
    ])

    return {
      totalTracks: tracksResult.status === 'fulfilled'
        ? Number((tracksResult.value as unknown as { rows: { count: number }[] }).rows?.[0]?.count ?? 0)
        : null,
      totalRevenue: revenueResult.status === 'fulfilled'
        ? Number((revenueResult.value as unknown as { rows: { total: number }[] }).rows?.[0]?.total ?? 0)
        : null,
      activeReleases: releasesResult.status === 'fulfilled'
        ? Number((releasesResult.value as unknown as { rows: { count: number }[] }).rows?.[0]?.count ?? 0)
        : null,
      walletBalance: null, // Computed from ledger — future phase
    }
  } catch {
    return { totalTracks: null, totalRevenue: null, activeReleases: null, walletBalance: null }
  }
}

function formatStat(value: number | null, isCurrency = false): string {
  if (value === null) return '—'
  if (isCurrency) {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value)
  }
  return value.toLocaleString()
}

// Type guards using zonga-core domain types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isActiveCreator(status: CreatorStatus): boolean { return status === 'active' }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPublishedAsset(status: AssetStatus): boolean { return status === 'published' }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPublishedRelease(status: ReleaseStatus): boolean { return status === 'released' }

const quickActions = [
  { title: 'Upload Track', description: 'Add a new track or album to your catalog', icon: '🎵', href: 'catalog/upload' },
  { title: 'Create Release', description: 'Bundle assets into a new release', icon: '📀', href: 'releases/new' },
  { title: 'Request Payout', description: 'Withdraw your earnings to your wallet', icon: '💰', href: 'payouts/new' },
  { title: 'View Analytics', description: 'See listener trends and demographics', icon: '📊', href: 'analytics' },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const stats = await getDashboardStats()

  const statCards = [
    { label: 'Total Tracks', value: formatStat(stats.totalTracks), change: stats.totalTracks !== null ? 'Live from DB' : 'No data yet' },
    { label: 'Total Revenue', value: formatStat(stats.totalRevenue, true), change: stats.totalRevenue !== null ? 'Live from DB' : 'No data yet' },
    { label: 'Active Releases', value: formatStat(stats.activeReleases), change: stats.activeReleases !== null ? 'Live from DB' : 'No data yet' },
    { label: 'Wallet Balance', value: formatStat(stats.walletBalance, true), change: 'Coming soon' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Welcome to Zonga</h1>
        <p className="text-gray-500 mt-1">
          Manage your catalog, track revenue, view payouts, and grow your audience — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">{stat.label}</div>
              <div className="text-3xl font-bold text-navy">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-2">{stat.change}</div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-electric/30 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-navy group-hover:text-electric transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-navy mb-4">Recent Activity</h2>
        <Card>
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🎵</div>
            <h3 className="font-semibold text-navy mb-1">No activity yet</h3>
            <p className="text-sm text-gray-500">
              Activity will appear here once you upload your first track.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
