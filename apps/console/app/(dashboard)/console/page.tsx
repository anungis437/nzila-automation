import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import {
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

const tiles = [
  {
    name: 'Internal Docs',
    href: '/docs',
    icon: DocumentTextIcon,
    description: 'Curated internal documentation and guides.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    description: 'Portfolio analytics dashboards and reports.',
    color: 'bg-green-50 text-green-600',
  },
  {
    name: 'Automation',
    href: '/automation',
    icon: CogIcon,
    description: 'Migration orchestration and validation.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    name: 'Standards',
    href: '/standards',
    icon: BookOpenIcon,
    description: 'Scripts Book templates and CI/CD standards.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    name: 'Deployments',
    href: '/console',
    icon: RocketLaunchIcon,
    description: 'Azure deployment status (coming soon).',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    name: 'Security',
    href: '/console',
    icon: ShieldCheckIcon,
    description: 'Compliance and security overview (coming soon).',
    color: 'bg-red-50 text-red-600',
  },
]

export const dynamic = 'force-dynamic'

export default async function ConsoleDashboard() {
  const user = await currentUser()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Nzila Ventures — Internal Operations Console</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.name}
            href={tile.href}
            className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className={`inline-flex p-3 rounded-lg mb-4 ${tile.color}`}>
              <tile.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{tile.name}</h3>
            <p className="text-sm text-gray-500">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
