/**
 * @nzila/platform-evidence-pack — Orchestrator
 *
 * Coordinates evidence pack lifecycle: creation, sealing, status transitions.
 * All mutations go through ports for DI/testing.
 *
 * @module @nzila/platform-evidence-pack/orchestrator
 */
import { createHash, randomUUID } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  EvidencePackIndex,
  EvidenceArtifact,
  EvidencePackStatus,
  OrchestratorPorts,
  SealData,
} from './types'
import { evidencePackIndexSchema } from './types'

const logger = createLogger('evidence-orchestrator')

// ── Orchestrator ────────────────────────────────────────────────────────────

export class EvidencePackOrchestrator {
  private readonly ports: OrchestratorPorts

  constructor(ports: OrchestratorPorts) {
    this.ports = ports
  }

  /**
   * Create a new evidence pack with artifacts.
   * Validates schema, generates pack ID if not provided, and persists.
   */
  async createPack(input: {
    orgId: string
    controlFamily: string
    eventType: string
    eventId: string
    summary: string
    controlsCovered: readonly string[]
    artifacts: readonly EvidenceArtifact[]
    createdBy: string
    packId?: string
  }): Promise<EvidencePackIndex> {
    const packId = input.packId ?? generatePackId(input.controlFamily, input.eventId)
    const runId = randomUUID()

    const pack: EvidencePackIndex = {
      packId,
      orgId: input.orgId,
      controlFamily: input.controlFamily,
      eventType: input.eventType,
      eventId: input.eventId,
      runId,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      summary: input.summary,
      controlsCovered: [...input.controlsCovered],
      artifacts: [...input.artifacts],
    }

    // Validate against schema
    evidencePackIndexSchema.parse(pack)

    await this.ports.savePack(pack)
    logger.info('Evidence pack created', { packId, orgId: input.orgId, artifactCount: input.artifacts.length })

    return pack
  }

  /**
   * Seal an evidence pack with cryptographic integrity.
   * Computes SHA-256 digest and Merkle root over all artifact hashes.
   */
  async sealPack(packId: string): Promise<EvidencePackIndex> {
    const pack = await this.ports.loadPack(packId)
    if (!pack) {
      throw new Error(`Evidence pack '${packId}' not found`)
    }
    if (pack.seal) {
      throw new Error(`Evidence pack '${packId}' is already sealed`)
    }

    const seal = computeSeal(pack)

    const sealedPack: EvidencePackIndex = {
      ...pack,
      seal,
    }

    await this.ports.savePack(sealedPack)
    await this.ports.updateStatus(packId, 'sealed')

    logger.info('Evidence pack sealed', {
      packId,
      digest: seal.packDigest,
      merkleRoot: seal.artifactsMerkleRoot,
      artifactCount: seal.artifactCount,
    })

    return sealedPack
  }

  /**
   * Load a pack by ID.
   */
  async getPack(packId: string): Promise<EvidencePackIndex | null> {
    return this.ports.loadPack(packId)
  }

  /**
   * List all packs for an org.
   */
  async listPacks(orgId: string): Promise<readonly EvidencePackIndex[]> {
    return this.ports.listPacks(orgId)
  }

  /**
   * Update pack status.
   */
  async updateStatus(packId: string, status: EvidencePackStatus): Promise<void> {
    await this.ports.updateStatus(packId, status)
    logger.info('Evidence pack status updated', { packId, status })
  }
}

// ── Seal Computation ────────────────────────────────────────────────────────

function computeSeal(pack: EvidencePackIndex): SealData {
  const artifactHashes = pack.artifacts.map((a) => a.sha256)
  const merkleRoot = computeMerkleRoot(artifactHashes)

  // Canonical JSON of pack (without seal)
  const { seal: _seal, ...packWithoutSeal } = pack as unknown as Record<string, unknown>
  const canon = canonicalize(packWithoutSeal)
  const packDigest = createHash('sha256').update(canon).digest('hex')

  return {
    sealVersion: '1.0',
    algorithm: 'sha256',
    packDigest,
    artifactsMerkleRoot: merkleRoot,
    artifactCount: artifactHashes.length,
    sealedAt: new Date().toISOString(),
  }
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return createHash('sha256').update('').digest('hex')
  }

  let layer: Buffer<ArrayBuffer>[] = hashes.map((h) => Buffer.from(h, 'hex'))

  while (layer.length > 1) {
    const next: Buffer<ArrayBuffer>[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]!
      const right = i + 1 < layer.length ? layer[i + 1]! : layer[i]!
      const combined = createHash('sha256')
        .update(Buffer.concat([left, right]))
        .digest()
      next.push(combined)
    }
    layer = next
  }

  return layer[0]!.toString('hex')
}

function canonicalize(obj: unknown): string {
  return JSON.stringify(deepSortKeys(obj))
}

function deepSortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepSortKeys)
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = deepSortKeys((obj as Record<string, unknown>)[key])
  }
  return sorted
}

function generatePackId(controlFamily: string, eventId: string): string {
  const year = new Date().getFullYear()
  const seq = randomUUID().slice(0, 8)
  return `${controlFamily.toUpperCase()}-${year}-${eventId}-${seq}`
}
