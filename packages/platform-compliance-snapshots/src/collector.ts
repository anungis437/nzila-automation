/**
 * @nzila/platform-compliance-snapshots — Collector
 *
 * Collects compliance state from configured sources into a snapshot.
 * Uses port pattern for all external data access. Computes summary
 * statistics (compliance score) automatically.
 *
 * @module @nzila/platform-compliance-snapshots/collector
 */
import { randomUUID } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  CollectorPorts,
  ComplianceControl,
  ComplianceSnapshot,
  SnapshotSummary,
} from './types'
import { complianceSnapshotSchema } from './types'

const logger = createLogger('compliance-collector')

// ── Summary Computation ─────────────────────────────────────────────────────

export function computeSummary(controls: readonly ComplianceControl[]): SnapshotSummary {
  const total = controls.length
  const compliant = controls.filter((c) => c.status === 'compliant').length
  const nonCompliant = controls.filter((c) => c.status === 'non-compliant').length
  const partial = controls.filter((c) => c.status === 'partial').length
  const notAssessed = controls.filter((c) => c.status === 'not-assessed').length

  const assessed = total - notAssessed
  const score = assessed > 0 ? Math.round(((compliant + partial * 0.5) / assessed) * 100) : 0

  return {
    totalControls: total,
    compliant,
    nonCompliant,
    partial,
    notAssessed,
    complianceScore: score,
  }
}

// ── Collector ───────────────────────────────────────────────────────────────

export class ComplianceCollector {
  private readonly ports: CollectorPorts

  constructor(ports: CollectorPorts) {
    this.ports = ports
  }

  /**
   * Collect compliance controls for an org and build a pending snapshot.
   */
  async collect(input: {
    orgId: string
    collectedBy: string
    version: number
    metadata?: Record<string, string>
  }): Promise<ComplianceSnapshot> {
    const controls = await this.ports.fetchControls(input.orgId)

    if (controls.length === 0) {
      throw new Error(`No compliance controls found for org '${input.orgId}'`)
    }

    const summary = computeSummary(controls)
    const snapshotId = randomUUID()

    const snapshot: ComplianceSnapshot = {
      snapshotId,
      orgId: input.orgId,
      version: input.version,
      status: 'collected',
      collectedAt: new Date().toISOString(),
      collectedBy: input.collectedBy,
      controls: [...controls],
      summary,
      metadata: input.metadata ?? {},
    }

    // Validate
    complianceSnapshotSchema.parse(snapshot)

    logger.info('Compliance snapshot collected', {
      snapshotId,
      orgId: input.orgId,
      version: input.version,
      totalControls: summary.totalControls,
      complianceScore: summary.complianceScore,
    })

    return snapshot
  }
}
