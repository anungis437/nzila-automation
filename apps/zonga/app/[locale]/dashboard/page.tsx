/**
 * Dashboard Home — Overview for Zonga: catalog summary,
 * revenue snapshot, quick actions, recent activity.
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const quickActions = [
  { title: 'Upload Track', description: 'Add a new track or album to your catalog', icon: '🎵', href: 'catalog/upload' },
  { title: 'Create Release', description: 'Bundle assets into a new release', icon: '📀', href: 'releases/new' },
  { title: 'Request Payout', description: 'Withdraw your earnings to your wallet', icon: '💰', href: 'payouts/new' },
  { title: 'View Analytics', description: 'See listener trends and demographics', icon: '📊', href: 'analytics' },
];

const statCards = [
  { label: 'Total Tracks', value: '—', change: 'No data yet', trend: 'neutral' as const },
  { label: 'Total Revenue', value: '—', change: 'No data yet', trend: 'neutral' as const },
  { label: 'Active Releases', value: '—', change: 'No data yet', trend: 'neutral' as const },
  { label: 'Wallet Balance', value: '—', change: 'No data yet', trend: 'neutral' as const },
];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

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
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-sm font-medium text-gray-500 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold text-navy">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-2">{stat.change}</div>
          </div>
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">🎵</div>
          <h3 className="font-semibold text-navy mb-1">No activity yet</h3>
          <p className="text-sm text-gray-500">
            Activity will appear here once you upload your first track.
          </p>
        </div>
      </div>
    </div>
  );
}
