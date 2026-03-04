/**
 * @nzila/platform-procurement-proof — Evidence Pack Collector
 *
 * Fetches the latest evidence pack for an org from the evidence pack
 * orchestrator. Returns pack metadata, seal status, and integrity hashes.
 *
 * @module @nzila/platform-procurement-proof/collectors/evidence-pack-latest
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type { OrchestratorPorts } from '@nzila/platform-evidence-pack'
import type {
  CollectorResult,
  EvidencePackCollectorData,
} from './types'
import { evidencePackCollectorDataSchema } from './types'

const logger = createLogger('collector:evidence-pack-latest')

export interface EvidencePackCollectorPorts {
  readonly listPacks: OrchestratorPorts['listPacks']
  readonly loadPack: OrchestratorPorts['loadPack']
}

/**
 * Collect the latest evidence pack for an org.
 */
export async function collectLatestEvidencePack(
  orgId: string,
  ports: EvidencePackCollectorPorts,
): Promise<CollectorResult<EvidencePackCollectorData>> {
  const now = new Date().toISOString()
  const source = '@nzila/platform-evidence-pack'

  try {
    const packs = await ports.listPacks(orgId)

    if (packs.length === 0) {
      logger.info('No evidence packs found for org', { orgId })
      return {
        status: 'not_available',
        source,
        collectedAt: now,
        data: null,
        reason: 'No evidence packs exist for this org. Generate one via the Proof Center.',
      }
    }

    // Get the latest pack (sorted by createdAt descending)
    const sorted = [...packs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const latest = sorted[0]!

    const data: EvidencePackCollectorData = {
      packId: latest.packId,
      orgId: latest.orgId,
      controlFamily: latest.controlFamily,
      artifactCount: latest.artifacts.length,
      sealDigest: latest.seal?.packDigest ?? null,
      merkleRoot: latest.seal?.artifactsMerkleRoot ?? null,
      createdAt: latest.createdAt,
      sealed: !!latest.seal,
    }

    // Validate
    evidencePackCollectorDataSchema.parse(data)

    // Compute integrity hash over the data
    const integrityHash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')

    logger.info('Evidence pack collected', {
      orgId,
      packId: data.packId,
      sealed: data.sealed,
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
    logger.error('Failed to collect evidence pack', { orgId, error: message })

    return {
      status: 'not_available',
      source,
      collectedAt: now,
      data: null,
      reason: `Evidence pack collection failed: ${message}`,
    }
  }
}
