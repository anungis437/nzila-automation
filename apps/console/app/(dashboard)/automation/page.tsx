import { PlayIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Automation | Nzila Console',
}

const pipelines = [
  { name: 'Portfolio Deep Dive', status: 'idle', lastRun: '—' },
  { name: 'Backbone Architecture Analysis', status: 'idle', lastRun: '—' },
  { name: 'Business Intelligence Report', status: 'idle', lastRun: '—' },
  { name: 'Multi-Vertical Orchestration', status: 'idle', lastRun: '—' },
  { name: 'Memora Comprehensive Analysis', status: 'idle', lastRun: '—' },
]

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-600',
    running: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[status] ?? styles.idle}`}>
      {status}
    </span>
  )
}

export default function AutomationPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Automation</h1>
      <p className="text-gray-500 mb-8">
        Read-only view of automation pipelines from the automation package.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Pipeline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Run</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pipelines.map((p) => (
              <tr key={p.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-gray-500">{p.lastRun}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled
                    className="inline-flex items-center gap-1 text-xs text-gray-400 cursor-not-allowed"
                    title="Trigger coming soon"
                  >
                    <PlayIcon className="h-4 w-4" /> Run
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Trigger support will be available once the{' '}
        <code className="bg-gray-100 px-1 rounded">@nzila/automation</code> API is connected.
      </p>
    </div>
  )
}
