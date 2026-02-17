import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Analytics | Nzila Console',
}

const stats = [
  { label: 'Active Verticals', value: '5', icon: GlobeAltIcon },
  { label: 'Platforms Tracked', value: '15', icon: ChartBarIcon },
  { label: 'Monthly Growth', value: '+12%', icon: ArrowTrendingUpIcon },
  { label: 'Team Members', value: '8', icon: UsersIcon },
]

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
      <p className="text-gray-500 mb-8">
        Read-only portfolio analytics powered by the analytics package.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4"
          >
            <s.icon className="h-8 w-8 text-blue-600 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-400">
        <ChartBarIcon className="h-10 w-10 mx-auto mb-3" />
        <p className="font-medium text-gray-600">Charts coming soon</p>
        <p className="text-sm mt-1">
          Connect the <code className="bg-gray-100 px-1 rounded">@nzila/analytics</code> package
          to surface live data here.
        </p>
      </div>
    </div>
  )
}
