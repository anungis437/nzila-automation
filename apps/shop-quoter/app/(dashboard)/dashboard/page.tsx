import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import {
  DocumentTextIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

const stats = [
  { label: 'Active Quotes', value: '—', icon: DocumentTextIcon, color: 'text-purple-600 bg-purple-50' },
  { label: 'Pending Review', value: '—', icon: ClockIcon, color: 'text-amber-600 bg-amber-50' },
  { label: 'Accepted (MTD)', value: '—', icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
  { label: 'Revenue (MTD)', value: '—', icon: CurrencyDollarIcon, color: 'text-blue-600 bg-blue-50' },
]

const quickActions = [
  {
    name: 'New Quote',
    href: '/quotes/new',
    icon: PlusIcon,
    description: 'Create a new gift box proposal.',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  },
  {
    name: 'View Clients',
    href: '/clients',
    icon: UserGroupIcon,
    description: 'Manage your client directory.',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    name: 'Import Legacy',
    href: '/import',
    icon: ArrowDownTrayIcon,
    description: 'Migrate data from ShopMoiÇa V1.',
    color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  },
]

const recentActivity = [
  { id: 'placeholder-1', action: 'Quote created', detail: 'No activity yet', time: '—' },
]

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your quoting activity.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className={`rounded-lg p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl border border-gray-200 transition ${action.color}`}
              >
                <action.icon className="h-6 w-6" />
                <div>
                  <p className="font-semibold text-gray-900">{action.name}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl border border-gray-200">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ExclamationTriangleIcon className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No quotes yet. Create your first one!</p>
              <Link
                href="/quotes/new"
                className="mt-3 text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                Create Quote →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
