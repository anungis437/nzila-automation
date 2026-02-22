/**
 * @nzila/evidence — Evidence Pack Sealing and Verification
 *
 * Local adoption of @nzila/os-core evidence sealing API.
 * API is intentionally compatible with @nzila/os-core/evidence/seal so this
 * module can be replaced by the published package when available.
 *
 * Exports:
 *   computeMerkleRoot(hashes)   — binary Merkle root over artifact SHA-256 hashes
 *   generateSeal(packIndex, opts)   — produce a SealEnvelope for a pack index
 *   verifySeal(packIndex, opts)     — verify the envelope embedded in a pack index
 *
 * @see packages/os-core/src/evidence/seal.ts in nzila-automation
 */

import { createHash, createHmac } from 'node:crypto'

// ── Merkle root ───────────────────────────────────────────────────────────────

/**
 * Compute a binary Merkle root from an ordered array of hex-encoded SHA-256
 * artifact hashes. If the array is empty, returns the hash of an empty string.
 * @param {string[]} hashes
 * @returns {string}
 */
export function computeMerkleRoot(hashes) {
  if (hashes.length === 0) return createHash('sha256').update('').digest('hex')

  let layer = hashes.map(h => Buffer.from(h, 'hex'))
  while (layer.length > 1) {
    const next = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i]
      next.push(createHash('sha256').update(Buffer.concat([left, right])).digest())
    }
    layer = next
  }
  return layer[0].toString('hex')
}

// ── Deep-sort for canonical JSON ──────────────────────────────────────────────

function deepSort(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepSort)
  return Object.fromEntries(Object.keys(obj).sort().map(k => [k, deepSort(obj[k])]))
}

// ── Seal generation ───────────────────────────────────────────────────────────

/**
 * Generate a cryptographic seal for an evidence pack index.
 *
 * @param {Record<string, unknown> & { artifacts?: Array<{sha256: string}> }} packIndex
 * @param {{ hmacKey?: string, sealedAt?: string }} [opts]
 * @returns {{ sealVersion: string, algorithm: string, packDigest: string,
 *             artifactsMerkleRoot: string, artifactCount: number,
 *             sealedAt: string, hmacSignature?: string, hmacKeyId?: string }}
 */
export function generateSeal(packIndex, opts = {}) {
  // Strip any existing seal
  const { seal: _existing, ...indexWithoutSeal } = packIndex
  const cleanIndex = deepSort(indexWithoutSeal)
  const canonicalJson = JSON.stringify(cleanIndex)
  const packDigest = createHash('sha256').update(canonicalJson).digest('hex')

  const artifactHashes = (packIndex.artifacts ?? []).map(a => a.sha256)
  const artifactsMerkleRoot = computeMerkleRoot(artifactHashes)

  const envelope = {
    sealVersion: '1.0',
    algorithm: 'sha256',
    packDigest,
    artifactsMerkleRoot,
    artifactCount: artifactHashes.length,
    sealedAt: opts.sealedAt ?? new Date().toISOString(),
  }

  const key = opts.hmacKey ?? process.env.EVIDENCE_SEAL_KEY
  if (key) {
    envelope.hmacSignature = createHmac('sha256', key).update(packDigest).digest('hex')
    envelope.hmacKeyId = createHash('sha256').update(key).digest('hex').slice(-8)
  }

  return envelope
}

// ── Seal verification ─────────────────────────────────────────────────────────

/**
 * Verify the integrity seal embedded in a pack index.
 * The pack must have a `.seal` property (the SealEnvelope).
 *
 * @param {Record<string, unknown> & { seal?: Record<string, unknown>, artifacts?: Array<{sha256: string}> }} packIndex
 * @param {{ hmacKey?: string }} [opts]
 * @returns {{ valid: boolean, digestMatch: boolean, merkleMatch: boolean,
 *             signatureVerified: boolean | 'no-key' | 'unsigned', errors: string[] }}
 */
export function verifySeal(packIndex, opts = {}) {
  const errors = []
  const seal = packIndex.seal

  if (!seal) {
    return {
      valid: false,
      digestMatch: false,
      merkleMatch: false,
      signatureVerified: 'unsigned',
      errors: ['No seal found on evidence pack index'],
    }
  }

  // 1. Recompute pack digest
  const { seal: _s, ...indexWithoutSeal } = packIndex
  const cleanIndex = deepSort(indexWithoutSeal)
  const canonicalJson = JSON.stringify(cleanIndex)
  const recomputedDigest = createHash('sha256').update(canonicalJson).digest('hex')
  const digestMatch = recomputedDigest === seal.packDigest
  if (!digestMatch) {
    errors.push(`Pack digest mismatch: expected ${seal.packDigest}, got ${recomputedDigest}`)
  }

  // 2. Verify Merkle root
  const artifactHashes = (packIndex.artifacts ?? []).map(a => a.sha256)
  const recomputedMerkle = computeMerkleRoot(artifactHashes)
  const merkleMatch = recomputedMerkle === seal.artifactsMerkleRoot
  if (!merkleMatch) {
    errors.push(`Merkle root mismatch: expected ${seal.artifactsMerkleRoot}, got ${recomputedMerkle}`)
  }

  // 3. Verify HMAC
  let signatureVerified = 'unsigned'
  if (seal.hmacSignature) {
    const key = opts.hmacKey ?? process.env.EVIDENCE_SEAL_KEY
    if (!key) {
      signatureVerified = 'no-key'
      errors.push('HMAC signature present but no key available for verification')
    } else {
      const expected = createHmac('sha256', key).update(seal.packDigest).digest('hex')
      signatureVerified = expected === seal.hmacSignature
      if (!signatureVerified) {
        errors.push('HMAC signature verification failed')
      }
    }
  }

  return {
    valid: digestMatch && merkleMatch && (signatureVerified === true || signatureVerified === 'unsigned'),
    digestMatch,
    merkleMatch,
    signatureVerified,
    errors,
  }
}
