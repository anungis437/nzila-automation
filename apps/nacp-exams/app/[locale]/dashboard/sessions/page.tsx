import Link from 'next/link'
import { Card } from '@nzila/ui'
import { listSessions, getSessionStats } from '@/lib/actions/session-actions'

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function SessionsPage() {
  const [{ sessions }, stats] = await Promise.all([
    listSessions(),
    getSessionStats(),
  ])

  const statCards = [
    { label: 'Total Sessions', value: stats.total },
    { label: 'Scheduled', value: stats.scheduled },
    { label: 'In Progress', value: stats.inProgress },
    { label: 'Completed', value: stats.completed },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Exam Sessions</h1>
          <p className="text-gray-500 mt-1">Schedule, monitor, and manage exam sessions.</p>
        </div>
        <Link
          href="sessions/new"
          className="bg-electric text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition"
        >
          + New Session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className="p-5">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-navy mt-1">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Session table */}
      <Card>
        {sessions.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-6 py-3">Exam</th>
                <th className="px-4 py-3">Center</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Candidates</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-navy">{s.examName}</td>
                  <td className="px-4 py-3 text-gray-600">{s.centerName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.candidateCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-navy">No sessions yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first exam session to get started.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
