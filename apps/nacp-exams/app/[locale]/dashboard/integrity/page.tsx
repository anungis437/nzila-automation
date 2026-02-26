import { Card } from '@nzila/ui'
import { getIntegrityDashboard } from '@/lib/actions/integrity-actions'

const verifyColor: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  tampered: 'bg-red-100 text-red-700',
}

export default async function IntegrityPage() {
  const dash = await getIntegrityDashboard()

  const statCards = [
    { label: 'Total Artifacts', value: dash.totalArtifacts, icon: '🔐' },
    { label: 'Verified', value: dash.verifiedCount, icon: '✅' },
    { label: 'Pending', value: dash.pendingCount, icon: '⏳' },
    { label: 'Integrity Score', value: `${dash.integrityScore}%`, icon: '🛡️' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Integrity Monitor</h1>

      {/* KPI cards */}
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

      {/* Integrity score gauge */}
      <Card>
        <div className="p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Overall Integrity</h2>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                dash.integrityScore >= 90 ? 'bg-green-500' :
                dash.integrityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${dash.integrityScore}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>0%</span>
            <span>
              {dash.verifiedCount} of {dash.totalArtifacts} artifacts verified
            </span>
            <span>100%</span>
          </div>
        </div>
      </Card>

      {/* Recent artifacts table */}
      <h2 className="text-lg font-semibold text-navy mt-8 mb-4">Recent Artifacts</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Artifact</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Session</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Created</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dash.recentArtifacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No integrity artifacts found.
                  </td>
                </tr>
              )}
              {dash.recentArtifacts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-navy">{a.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-gray-600">{a.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{a.entityId?.slice(0, 8) ?? '—'}…</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${verifyColor[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Failed artifacts alert */}
      {dash.failedCount > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">
            ⚠️ {dash.failedCount} artifact{dash.failedCount !== 1 ? 's' : ''} failed verification — review required.
          </p>
        </div>
      )}
    </div>
  )
}
