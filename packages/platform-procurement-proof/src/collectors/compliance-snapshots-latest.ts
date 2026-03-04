/**
 * @nzila/platform-procurement-proof — Compliance Snapshots Collector
 *
 * Fetches the latest compliance snapshot chain state for an org.
 * Reports chain validity, hash linkage, and compliance score.
 *
 * @module @nzila/platform-procurement-proof/collectors/compliance-snapshots-latest
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import { nowISO } from '@nzila/platform-utils/time'
import type { ChainPorts, GeneratorPorts } from '@nzila/platform-compliance-snapshots'
import { computeSnapshotHash } from '@nzila/platform-compliance-snapshots'
import type {
  CollectorResult,
  ComplianceSnapshotCollectorData,
} from './types'
import { complianceSnapshotCollectorDataSchema } from './types'

const logger = createLogger('collector:compliance-snapshots')

export interface ComplianceSnapshotCollectorPorts {
  readonly listSnapshots: GeneratorPorts['listSnapshots']
  readonly loadChain: ChainPorts['loadChain']
}

/**
 * Collect the latest compliance snapshot chain state for an org.
 */
export async function collectLatestComplianceSnapshots(
  orgId: string,
  ports: ComplianceSnapshotCollectorPorts,
): Promise<CollectorResult<ComplianceSnapshotCollectorData>> {
  const now = nowISO()
  const source = '@nzila/platform-compliance-snapshots'

  try {
    const [snapshots, chain] = await Promise.all([
      ports.listSnapshots(orgId),
      ports.loadChain(orgId),
    ])

    if (snapshots.length === 0 || chain.length === 0) {
      logger.info('No compliance snapshots found for org', { orgId })
      return {
        status: 'not_available',
        source,
        collectedAt: now,
        data: null,
        reason: 'No compliance snapshots exist for this org. Generate one via the Proof Center or run the golden demo.',
      }
    }

    // Get latest snapshot (highest version)
    const sorted = [...snapshots].sort((a, b) => b.version - a.version)
    const latest = sorted[0]!

    // Find matching chain entry
    const latestChainEntry = chain.find((e) => e.snapshotId === latest.snapshotId)
    const latestHash = latestChainEntry?.snapshotHash ?? computeSnapshotHash(latest)

    // Verify chain integrity
    let chainValid = true
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i]!
      const previous = chain[i - 1]!
      if (current.previousHash !== previous.snapshotHash) {
        chainValid = false
        break
      }
    }

    const data: ComplianceSnapshotCollectorData = {
      latestSnapshotId: latest.snapshotId,
      latestSnapshotHash: latestHash,
      previousHash: latestChainEntry?.previousHash ?? null,
      chainValid,
      chainLength: chain.length,
      complianceScore: latest.summary.complianceScore,
      totalControls: latest.summary.totalControls,
      compliantControls: latest.summary.compliant,
      collectedAt: latest.collectedAt,
    }

    // Validate
    complianceSnapshotCollectorDataSchema.parse(data)

    const integrityHash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')

    logger.info('Compliance snapshots collected', {
      orgId,
      chainLength: data.chainLength,
      chainValid: data.chainValid,
      complianceScore: data.complianceScore,
    })

    return {
      status: 'ok',
      source,
      collectedAt: now,
      data,
      integrityHash,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Failed to collect compliance snapshots', { orgId, error: message })

    return {
      status: 'not_available',
      source,
      collectedAt: now,
      data: null,
      reason: `Compliance snapshot collection failed: ${message}`,
    }
  }
}
