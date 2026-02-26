import { Card } from '@nzila/ui'
import Link from 'next/link'
import { listCenters, getCenterStats } from '@/lib/actions/center-actions'

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  pending_approval: 'bg-amber-100 text-amber-700',
}

export default async function CentersPage() {
  const [{ centers }, stats] = await Promise.all([listCenters(), getCenterStats()])

  const statCards = [
    { label: 'Total Centers', value: stats.total, icon: '🏢' },
    { label: 'Active', value: stats.active, icon: '✅' },
    { label: 'Pending', value: stats.pending, icon: '⏳' },
    { label: 'Suspended', value: stats.suspended, icon: '🚫' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Exam Centers</h1>
        <Link
          href="centers/new"
          className="bg-electric text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-electric/90 transition"
        >
          + Add Center
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className="p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-2xl font-bold text-navy">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Code</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">City</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Province</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Capacity</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {centers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No exam centers registered yet.
                  </td>
                </tr>
              )}
              {centers.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                  <td className="px-4 py-3 text-gray-600">{c.city}</td>
                  <td className="px-4 py-3 text-gray-600">{c.province}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.capacity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
