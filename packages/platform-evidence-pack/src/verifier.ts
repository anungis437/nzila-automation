/**
 * @nzila/platform-evidence-pack — Verifier
 *
 * Verify integrity of evidence packs by recomputing digests,
 * Merkle roots, and individual artifact hashes.
 *
 * @module @nzila/platform-evidence-pack/verifier
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  EvidencePackIndex,
  VerificationResult,
  ArtifactVerification,
  VerifierPorts,
} from './types'

const logger = createLogger('evidence-verifier')

/**
 * Verify the cryptographic integrity of an evidence pack.
 * Checks:
 *  1. Pack digest matches seal
 *  2. Merkle root matches seal
 *  3. Each artifact's actual SHA-256 matches the declared hash
 */
export async function verifyPack(
  pack: EvidencePackIndex,
  ports: VerifierPorts,
): Promise<VerificationResult> {
  const errors: string[] = []

  if (!pack.seal) {
    return {
      packId: pack.packId,
      valid: false,
      digestMatch: false,
      merkleMatch: false,
      artifactIntegrity: [],
      verifiedAt: new Date().toISOString(),
      errors: ['Pack has no seal — cannot verify'],
    }
  }

  // 1. Recompute pack digest
  const { seal: _seal, ...packWithoutSeal } = pack as unknown as Record<string, unknown>
  const canon = canonicalize(packWithoutSeal)
  const recomputedDigest = createHash('sha256').update(canon).digest('hex')
  const digestMatch = recomputedDigest === pack.seal.packDigest
  if (!digestMatch) {
    errors.push(`Pack digest mismatch: expected ${pack.seal.packDigest}, got ${recomputedDigest}`)
  }

  // 2. Recompute Merkle root
  const artifactHashes = pack.artifacts.map((a) => a.sha256)
  const recomputedMerkle = computeMerkleRoot(artifactHashes)
  const merkleMatch = recomputedMerkle === pack.seal.artifactsMerkleRoot
  if (!merkleMatch) {
    errors.push(`Merkle root mismatch: expected ${pack.seal.artifactsMerkleRoot}, got ${recomputedMerkle}`)
  }

  // 3. Verify each artifact hash
  const artifactResults: ArtifactVerification[] = []
  for (const artifact of pack.artifacts) {
    try {
      const content = await ports.readBlob(artifact.blobPath)
      const actualHash = createHash('sha256').update(content).digest('hex')
      const match = actualHash === artifact.sha256
      if (!match) {
        errors.push(`Artifact '${artifact.artifactId}' hash mismatch: expected ${artifact.sha256}, got ${actualHash}`)
      }
      artifactResults.push({
        artifactId: artifact.artifactId,
        expectedHash: artifact.sha256,
        actualHash,
        match,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Artifact '${artifact.artifactId}' read failed: ${msg}`)
      artifactResults.push({
        artifactId: artifact.artifactId,
        expectedHash: artifact.sha256,
        actualHash: null,
        match: false,
        error: msg,
      })
    }
  }

  const allArtifactsValid = artifactResults.every((r) => r.match)
  const valid = digestMatch && merkleMatch && allArtifactsValid

  logger.info('Evidence pack verification complete', {
    packId: pack.packId,
    valid,
    digestMatch,
    merkleMatch,
    artifactsVerified: artifactResults.length,
    artifactsFailed: artifactResults.filter((r) => !r.match).length,
  })

  return {
    packId: pack.packId,
    valid,
    digestMatch,
    merkleMatch,
    artifactIntegrity: artifactResults,
    verifiedAt: new Date().toISOString(),
    errors,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
