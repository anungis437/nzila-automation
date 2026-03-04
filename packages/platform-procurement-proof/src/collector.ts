/**
 * @nzila/platform-procurement-proof — Collector
 *
 * Aggregates proof artifacts across all five procurement sections into a
 * single ProcurementPack with manifest and optional signature.
 *
 * @module @nzila/platform-procurement-proof/collector
 */
import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  ProcurementPack,
  ProcurementManifest,
  ProcurementProofPorts,
  ProofPackStatus,
} from './types'

const logger = createLogger('procurement-proof-collector')

/**
 * Collect all proof sections and assemble a ProcurementPack.
 */
export async function collectProcurementPack(
  orgId: string,
  generatedBy: string,
  ports: ProcurementProofPorts,
): Promise<ProcurementPack> {
  const packId = randomUUID()

  logger.info('Collecting procurement proof pack', { packId, orgId })

  // Collect all sections in parallel
  const [security, dataLifecycle, operational, governance, sovereignty] =
    await Promise.all([
      ports.getSecurityPosture(orgId),
      ports.getDataLifecycle(orgId),
      ports.getOperationalEvidence(orgId),
      ports.getGovernanceEvidence(orgId),
      ports.getSovereigntyProfile(orgId),
    ])

  const sections = { security, dataLifecycle, operational, governance, sovereignty }

  // Build manifest with per-section checksums
  const checksums: Record<string, string> = {}
  for (const [key, value] of Object.entries(sections)) {
    checksums[key] = createHash('sha256')
      .update(JSON.stringify(value))
      .digest('hex')
  }

  const now = new Date().toISOString()
  const manifest: ProcurementManifest = {
    version: '1.0',
    sectionCount: 5,
    artifactCount: countArtifacts(sections),
    generatedAt: now,
    checksums,
  }

  const pack: ProcurementPack = {
    packId,
    orgId,
    generatedAt: now,
    generatedBy,
    status: 'complete' as ProofPackStatus,
    sections,
    manifest,
  }

  logger.info('Procurement pack collected', {
    packId,
    orgId,
    artifactCount: manifest.artifactCount,
  })

  return pack
}

/**
 * Sign a completed procurement pack.
 */
export async function signProcurementPack(
  pack: ProcurementPack,
  ports: ProcurementProofPorts,
): Promise<ProcurementPack> {
  const digest = createHash('sha256')
    .update(JSON.stringify(pack.sections))
    .update(JSON.stringify(pack.manifest))
    .digest('hex')

  const signature = await ports.signPack(digest)

  logger.info('Procurement pack signed', {
    packId: pack.packId,
    algorithm: signature.algorithm,
  })

  return {
    ...pack,
    status: 'signed',
    signature,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function countArtifacts(sections: ProcurementPack['sections']): number {
  let count = 0

  // Security: 3 artifacts (audit, attestation, vuln summary)
  count += 3

  // Data lifecycle: manifests + retention controls
  count += sections.dataLifecycle.manifests.length + 1

  // Operational: SLO targets + incidents + trends
  count += sections.operational.sloCompliance.targets.length
  count += 1 // incident summary
  count += sections.operational.trendWarnings.length

  // Governance: evidence packs + snapshot chain
  count += 2

  // Sovereignty: 1 profile
  count += 1

  return count
}
