import { Card } from '@nzila/ui'
import { getReportSummary, getSubjectPerformance, getSessionReports } from '@/lib/actions/report-actions'

export default async function ReportsPage() {
  const [summary, { subjects: subjectPerf }, { reports: sessions }] = await Promise.all([
    getReportSummary(),
    getSubjectPerformance(),
    getSessionReports(),
  ])

  const kpis = [
    { label: 'Total Sessions', value: summary.totalSessions, icon: '📅' },
    { label: 'Total Candidates', value: summary.totalCandidates, icon: '👤' },
    { label: 'Completed Sessions', value: summary.completedSessions, icon: '📝' },
    { label: 'Avg Score', value: summary.avgScore != null ? `${summary.avgScore}%` : '—', icon: '📊' },
    { label: 'Pass Rate', value: summary.passRate != null ? `${summary.passRate}%` : '—', icon: '✅' },
    { label: 'Passed', value: summary.passedCandidates, icon: '🎯' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Reports & Analytics</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpis.map((k) => (
          <Card key={k.label}>
            <div className="p-4 text-center">
              <div className="text-2xl mb-1">{k.icon}</div>
              <p className="text-xl font-bold text-navy">{k.value}</p>
              <p className="text-[10px] text-gray-500 uppercase">{k.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Subject performance */}
      <h2 className="text-lg font-semibold text-navy mb-4">Subject Performance</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Subject</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Submissions</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Avg Score</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Pass Rate</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {subjectPerf.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No subject data yet.
                  </td>
                </tr>
              )}
              {subjectPerf.map((sp) => (
                <tr key={sp.subjectCode} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-navy">{sp.subjectName}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{sp.candidateCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-navy">{sp.avgScore}%</td>
                  <td className="px-4 py-3 text-right text-gray-600">{sp.passRate}%</td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${
                          sp.passRate >= 80 ? 'bg-green-500' :
                          sp.passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(sp.passRate, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Session reports */}
      <h2 className="text-lg font-semibold text-navy mt-8 mb-4">Session Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.length === 0 && (
          <Card>
            <div className="p-12 text-center text-gray-400">
              No session reports available yet.
            </div>
          </Card>
        )}
        {sessions.map((sr) => (
          <Card key={sr.sessionId}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-navy">{sr.examName ?? 'Exam'}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  sr.status === 'completed' ? 'bg-green-100 text-green-700' :
                  sr.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {sr.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {sr.centerName ?? 'Center'} · {sr.scheduledDate ? new Date(sr.scheduledDate).toLocaleDateString() : '—'}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-navy">{sr.candidateCount}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Candidates</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-navy">{sr.avgScore != null ? `${sr.avgScore}%` : '—'}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Avg Score</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-navy">{sr.passRate != null ? `${sr.passRate}%` : '—'}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Pass Rate</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
