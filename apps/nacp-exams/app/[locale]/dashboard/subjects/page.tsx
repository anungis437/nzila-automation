import { Card } from '@nzila/ui'
import { listSubjects, getSubjectStats } from '@/lib/actions/subject-actions'

const levelColor: Record<string, string> = {
  foundation: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-purple-100 text-purple-700',
  professional: 'bg-green-100 text-green-700',
}

export default async function SubjectsPage() {
  const [{ subjects }, stats] = await Promise.all([listSubjects(), getSubjectStats()])

  const statCards = [
    { label: 'Total Subjects', value: stats.total, icon: '📚' },
    { label: 'Levels', value: stats.byLevel.length, icon: '🎯' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Subjects</h1>
        <button className="bg-electric text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-electric/90 transition">
          + Add Subject
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
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

      {/* Subject cards grouped by level */}
      {Object.entries(
        subjects.reduce<Record<string, typeof subjects>>((acc, s) => {
          const lvl = s.level ?? 'other'
          ;(acc[lvl] ??= []).push(s)
          return acc
        }, {})
      ).map(([level, items]) => (
        <div key={level} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColor[level] ?? 'bg-gray-100 text-gray-600'}`}>
              {level}
            </span>
            <span className="text-sm text-gray-400">{items.length} subject{items.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((subj) => (
              <Card key={subj.id}>
                <div className="p-5">
                  <h3 className="font-semibold text-navy mb-1">{subj.name}</h3>
                  <p className="text-xs font-mono text-gray-400 mb-3">{subj.code}</p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-navy">{subj.questionCount ?? '—'}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Questions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-navy">{subj.duration ? `${subj.duration}m` : '—'}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Duration</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-navy">{subj.passRate != null ? `${subj.passRate}%` : '—'}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Pass Rate</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {subjects.length === 0 && (
        <Card>
          <div className="p-12 text-center text-gray-400">
            No subjects configured yet.
          </div>
        </Card>
      )}
    </div>
  )
}
