/**
 * Nzila OS — Integration Health Proof Section
 *
 * Extends the governance proof pack with an integrations health snapshot.
 * Collects:
 *   - Success rates per provider (last 24h)
 *   - Circuit breaker open events count
 *   - DLQ backlog count
 *   - Last SLA breach timestamps
 *
 * No secrets are included. Payload is signed with the same HMAC
 * scheme used by the core proof generator.
 *
 * @module @nzila/platform-proof/integrations
 */
import { computeSignatureHash } from './proof'

// ── Types ───────────────────────────────────────────────────────────────────

export interface IntegrationProviderSnapshot {
  readonly provider: string
  readonly status: 'ok' | 'degraded' | 'down'
  readonly successRate24h: number
  readonly sentCount24h: number
  readonly failureCount24h: number
  readonly circuitState: 'closed' | 'open' | 'half_open'
  readonly circuitOpenCount: number
  readonly dlqBacklogCount: number
  readonly lastBreachAt: string | null
  readonly p95LatencyMs: number
}

export interface IntegrationsProofSection {
  readonly sectionId: string
  readonly sectionType: 'integrations_health'
  readonly generatedAt: string
  readonly providers: readonly IntegrationProviderSnapshot[]
  readonly overallAvailability: number
  readonly totalDlqBacklog: number
  readonly totalCircuitOpenCount: number
  readonly activeSlaBreaches: number
  readonly signatureHash: string
}

// ── Ports — injected dependencies ───────────────────────────────────────────

export interface IntegrationsProofPorts {
  /** Fetch health snapshots for all providers. */
  readonly fetchProviderSnapshots: (orgId: string) => Promise<readonly IntegrationProviderSnapshot[]>
}

// ── Section Generator ───────────────────────────────────────────────────────

/**
 * Generate an integrations health proof section.
 *
 * This does not write to the database — callers attach the section
 * to the main proof pack payload before persisting.
 */
export async function generateIntegrationsProofSection(
  orgId: string,
  ports: IntegrationsProofPorts,
): Promise<IntegrationsProofSection> {
  const providers = await ports.fetchProviderSnapshots(orgId)

  const totalSent = providers.reduce((s, p) => s + p.sentCount24h, 0)
  const totalSuccess = providers.reduce((s, p) => s + (p.sentCount24h * p.successRate24h), 0)
  const overallAvailability = totalSent > 0 ? totalSuccess / totalSent : 1

  const totalDlqBacklog = providers.reduce((s, p) => s + p.dlqBacklogCount, 0)
  const totalCircuitOpenCount = providers.reduce((s, p) => s + p.circuitOpenCount, 0)
  const activeSlaBreaches = providers.filter((p) => p.lastBreachAt !== null).length

  const generatedAt = new Date().toISOString()

  // Build signing payload — flat string map, no secrets
  const sigPayload: Record<string, string> = {
    sectionType: 'integrations_health',
    orgId,
    generatedAt,
    overallAvailability: overallAvailability.toFixed(6),
    totalDlqBacklog: String(totalDlqBacklog),
    totalCircuitOpenCount: String(totalCircuitOpenCount),
    activeSlaBreaches: String(activeSlaBreaches),
    providerCount: String(providers.length),
  }

  const signatureHash = computeSignatureHash(sigPayload)

  return {
    sectionId: `int-proof-${orgId}-${Date.now()}`,
    sectionType: 'integrations_health',
    generatedAt,
    providers,
    overallAvailability,
    totalDlqBacklog,
    totalCircuitOpenCount,
    activeSlaBreaches,
    signatureHash,
  }
}
