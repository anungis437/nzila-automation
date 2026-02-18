import Link from 'next/link'
import {
  CpuChipIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CloudIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Platform | Nzila Ventures',
  description: 'The Nzila Backbone — unified infrastructure powering all verticals',
}

const capabilities = [
  {
    icon: CpuChipIcon,
    name: 'Backbone Infrastructure',
    description:
      'Shared authentication, databases, CI/CD, and observability across all 15 platforms.',
  },
  {
    icon: ServerStackIcon,
    name: 'Multi-Tenant Architecture',
    description:
      'Isolated yet unified — each vertical runs on shared primitives with tenant-level separation.',
  },
  {
    icon: ShieldCheckIcon,
    name: 'Security & Compliance',
    description:
      'SOC 2 aligned patterns, Clerk-based identity, and role-based access control across apps.',
  },
  {
    icon: ChartBarIcon,
    name: 'Analytics Pipeline',
    description:
      'Automated portfolio analytics, migration tracking, and executive reporting.',
  },
  {
    icon: CloudIcon,
    name: 'Azure Native',
    description:
      'Container Apps, Static Web Apps, PostgreSQL, and Azure AI for production workloads.',
  },
  {
    icon: CogIcon,
    name: 'Automation Engine',
    description:
      'Python-powered validation, migration orchestration, and business intelligence automation.',
  },
]

export default function PlatformPage() {
  return (
    <main className="min-h-screen">
      <section className="bg-linear-to-br from-indigo-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            The Nzila Platform
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            A unified infrastructure layer — the Backbone — that powers social impact technology
            across healthcare, finance, agriculture, labor rights, and justice.
          </p>
          <Link
            href="/resources"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Read the Docs
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Platform Capabilities
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => (
            <div
              key={cap.name}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <cap.icon className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{cap.name}</h3>
              <p className="text-sm text-gray-500">{cap.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
