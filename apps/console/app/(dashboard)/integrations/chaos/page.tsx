/**
 * Chaos Simulation Dashboard
 * /integrations/chaos
 *
 * Platform-only page for managing chaos simulation on integration providers.
 * All chaos controls are disabled in production by hard guard.
 * Every chaos toggle is audited.
 *
 * @invariant INTEGRATION_CHAOS_PROD_GUARD_004
 */
import {
  BoltIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Card } from '@nzila/ui'

export const dynamic = 'force-dynamic'

// ── Types ───────────────────────────────────────────────────────────────────

type ChaosScenario = 'provider_down' | 'slow' | 'rate_limited' | 'partial_fail'

interface ScenarioInfo {
  id: ChaosScenario
  name: string
  description: string
  icon: React.ReactNode
  expectedImpact: string
}

const scenarios: ScenarioInfo[] = [
  {
    id: 'provider_down',
    name: 'Provider Down',
    description: 'Force adapter failure for all deliveries to target provider(s).',
    icon: <NoSymbolIcon className="h-5 w-5 text-red-500" />,
    expectedImpact: 'Circuit will open after threshold. DLQ entries will grow.',
  },
  {
    id: 'slow',
    name: 'Slow Response',
    description: 'Inject latency into adapter calls. Delivery succeeds but slowly.',
    icon: <ClockIcon className="h-5 w-5 text-amber-500" />,
    expectedImpact: 'P95/P99 latency will spike. May trigger degraded status.',
  },
  {
    id: 'rate_limited',
    name: 'Rate Limited (429)',
    description: 'Inject 429 responses with retry-after. Tests backoff logic.',
    icon: <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />,
    expectedImpact: 'Rate-limit counters increase. Retries should respect retry-after.',
  },
  {
    id: 'partial_fail',
    name: 'Partial Failure',
    description: 'Randomly fail a configurable percentage of adapter calls.',
    icon: <BoltIcon className="h-5 w-5 text-purple-500" />,
    expectedImpact: 'Success rate degrades proportionally. Circuit may trip at high %.',
  },
]

const allProviders = [
  'resend', 'sendgrid', 'mailgun', 'twilio',
  'firebase', 'slack', 'teams', 'hubspot',
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChaosSimulationPage() {
  // In production, this page would be blocked by middleware/rbac
  const isProd = process.env.NODE_ENV === 'production'
  const chaosEnabled = process.env.INTEGRATIONS_CHAOS_MODE === 'true'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BoltIcon className="h-6 w-6 text-purple-600" />
            Chaos Simulation
          </h1>
          <p className="text-sm text-gray-500">Simulate provider outages and failure scenarios (non-prod only)</p>
        </div>
        <Link
          href="/integrations/health"
          className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Health Dashboard
        </Link>
      </div>

      {/* Production guard banner */}
      {isProd && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <NoSymbolIcon className="h-5 w-5" />
            Chaos simulation is DISABLED in production
          </div>
          <p className="text-sm text-red-600 mt-1">
            This is enforced by a hard guard. To run chaos drills, use a staging or development environment.
          </p>
        </div>
      )}

      {/* Status */}
      <Card>
        <div className="p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Chaos Mode</h2>
            <p className="text-sm text-gray-500">
              {chaosEnabled && !isProd ? 'ENABLED — Chaos simulation is active' : 'DISABLED'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              disabled={isProd}
            >
              <BoltIcon className="h-4 w-4" />
              Enable Chaos
            </button>
            <button
              className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              disabled={isProd || !chaosEnabled}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Disable All
            </button>
          </div>
        </div>
      </Card>

      {/* Scenarios */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((s) => (
            <Card key={s.id}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-lg bg-gray-50 p-2">{s.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                    <div className="mt-2 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-700">
                      <strong>Impact:</strong> {s.expectedImpact}
                    </div>
                  </div>
                </div>
                {/* Provider targeting */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {allProviders.map((p) => (
                    <button
                      key={p}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-40"
                      disabled={isProd}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
