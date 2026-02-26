import Link from 'next/link'
import { Card } from '@nzila/ui'
import { listCandidates, getCandidateStats } from '@/lib/actions/candidate-actions'

const statusColors: Record<string, string> = {
  registered: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
}

export default async function CandidatesPage() {
  const [{ candidates }, stats] = await Promise.all([
    listCandidates(),
    getCandidateStats(),
  ])

  const statCards = [
    { label: 'Total Candidates', value: stats.total },
    { label: 'Registered', value: stats.registered },
    { label: 'Active', value: stats.active },
    { label: 'Completed', value: stats.completed },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Candidates</h1>
          <p className="text-gray-500 mt-1">Register and manage exam candidates.</p>
        </div>
        <Link
          href="candidates/new"
          className="bg-electric text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition"
        >
          + Register Candidate
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

      {/* Candidate table */}
      <Card>
        {candidates.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">Candidate #</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-navy">{c.firstName} {c.lastName}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.candidateNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.sessionCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="font-medium text-navy">No candidates registered</p>
            <p className="text-sm text-gray-500 mt-1">
              Register candidates to assign them to exam sessions.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
