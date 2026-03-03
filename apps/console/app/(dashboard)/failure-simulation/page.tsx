/**
 * Nzila OS — Failure Simulation Dashboard
 *
 * Displays current simulation state and feature flag status.
 * Actual toggle actions go through the API route.
 *
 * Dev/Pilot environments only. Platform admin / ops only.
 *
 * @see @nzila/platform-ops/failure-simulation
 */
import { requireRole } from '@/lib/rbac'
import {
  getSimulationState,
  canActivateSimulation,
  type SimulationState,
} from '@nzila/platform-ops'
import {
  BoltIcon,
  ShieldExclamationIcon,
  ServerStackIcon,
  BugAntIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

// ── Helpers ────────────────────────────────────────────────────────────────

function FlagBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
      {enabled ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
      {label}: {enabled ? 'ON' : 'OFF'}
    </span>
  )
}

function simulationIcon(type: string) {
  if (type === 'integration_failure') return BoltIcon
  if (type === 'db_latency_spike') return ServerStackIcon
  if (type === 'error_spike') return BugAntIcon
  return ShieldExclamationIcon
}

function simulationLabel(type: string): string {
  switch (type) {
    case 'integration_failure': return 'Integration Failure'
    case 'db_latency_spike': return 'DB Latency Spike'
    case 'error_spike': return 'Error Spike'
    default: return type
  }
}

// ── Page Component ─────────────────────────────────────────────────────────

export default async function FailureSimulationPage() {
  await requireRole('platform_admin', 'studio_admin', 'ops')

  const state: SimulationState = getSimulationState()
  const allowed = canActivateSimulation()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Failure Simulation</h1>
        <p className="text-gray-500 mt-1">
          Test runbooks and incident response — dev &amp; pilot environments only
        </p>
      </div>

      {/* Feature Flag Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Environment Status</h2>
        <div className="flex flex-wrap gap-3">
          <FlagBadge enabled={state.featureFlagEnabled} label="OPS_SIMULATION_ENABLED" />
          <FlagBadge enabled={state.environmentAllowed} label="Environment Allowed" />
          <FlagBadge enabled={allowed} label="Can Activate" />
        </div>
        {!allowed && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-800">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            Simulation is disabled. Set <code className="bg-yellow-100 px-1 py-0.5 rounded text-xs">OPS_SIMULATION_ENABLED=true</code> in a dev or pilot environment to enable.
          </div>
        )}
      </div>

      {/* Available Simulations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Simulation Types</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(['integration_failure', 'db_latency_spike', 'error_spike'] as const).map((type) => {
            const Icon = simulationIcon(type)
            const isActive = state.simulations.some((s) => s.type === type)
            return (
              <div key={type} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-2 bg-gray-50 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{simulationLabel(type)}</p>
                    <p className="text-xs text-gray-500">
                      {type === 'integration_failure' && 'Simulates provider outage (e.g. Stripe, HubSpot)'}
                      {type === 'db_latency_spike' && 'Adds artificial delay to database operations'}
                      {type === 'error_spike' && 'Multiplies error rate to test alerting pipelines'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Simulations */}
      {state.simulations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Active Simulations</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Scope</th>
                <th className="px-6 py-3 font-medium">Intensity</th>
                <th className="px-6 py-3 font-medium">Started</th>
                <th className="px-6 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.simulations.map((sim) => (
                <tr key={`${sim.type}-${sim.scope}`} className="text-gray-700">
                  <td className="px-6 py-3 font-medium">{simulationLabel(sim.type)}</td>
                  <td className="px-6 py-3 font-mono text-xs">{sim.scope}</td>
                  <td className="px-6 py-3">{sim.intensity}×</td>
                  <td className="px-6 py-3 font-mono text-xs">{new Date(sim.startedAt).toLocaleTimeString()}</td>
                  <td className="px-6 py-3 font-mono text-xs">{new Date(sim.expiresAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
