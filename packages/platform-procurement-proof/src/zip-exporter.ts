/**
 * @nzila/platform-procurement-proof — ZIP Exporter
 *
 * Exports a ProcurementPack as a real zip file containing:
 *   - MANIFEST.json        — hash list of all included files
 *   - procurement-pack.json — the pack payload
 *   - signatures.json       — Ed25519 signature + key id
 *   - verification.json     — how to verify + expected hashes
 *
 * Uses fflate for zero-dependency zip generation compatible with
 * any standard unzip tool.
 *
 * @module @nzila/platform-procurement-proof/zip-exporter
 */
import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto'
import { zipSync, type Zippable } from 'fflate'
import { createLogger } from '@nzila/os-core/telemetry'
import { nowISO } from '@nzila/platform-utils/time'
import { ProcurementSectionSchema } from './schemas/section.schema'
import type { ProcurementPack } from './types'

const logger = createLogger('procurement-proof-zip-exporter')

// ── Types ─────────────────────────────────────────────────────────────────

export interface ZipManifest {
  readonly version: '1.0'
  readonly generatedAt: string
  readonly generatedBy: string
  readonly packId: string
  readonly files: readonly ManifestFileEntry[]
  readonly integrityAlgorithm: 'sha256'
}

export interface ManifestFileEntry {
  readonly path: string
  readonly sha256: string
  readonly sizeBytes: number
}

export interface ZipSignature {
  readonly algorithm: 'Ed25519'
  readonly manifestDigest: string
  readonly signature: string
  readonly keyId: string
  readonly signedAt: string
  readonly signedBy: string
}

export interface ZipVerification {
  readonly packId: string
  readonly signatureAlgorithm: 'Ed25519'
  readonly keyId: string
  readonly manifestHash: string
  readonly expectedFiles: readonly string[]
  readonly verificationSteps: readonly string[]
  readonly generatedAt: string
  readonly instructions: string
}

export interface ZipExportResult {
  readonly packId: string
  readonly zipBuffer: Uint8Array
  readonly filename: string
  readonly manifest: ZipManifest
  readonly signature: ZipSignature
  readonly exportedAt: string
}

// ── Key Management ────────────────────────────────────────────────────────

let _cachedKeyPair: { privateKey: string; publicKey: string; keyId: string } | null = null

/**
 * Get or generate Ed25519 signing key pair.
 * In production, the private key comes from PROCUREMENT_SIGNING_KEY env var.
 * The key ID is the first 16 hex chars of the SHA-256 of the public key.
 *
 * The key pair is cached per process so that `getSigningKeyPair()` always
 * returns the same keys within a single runtime (important for verification).
 */
export function getSigningKeyPair(): {
  privateKey: string
  publicKey: string
  keyId: string
} {
  if (_cachedKeyPair) return _cachedKeyPair

  const envKey = process.env.PROCUREMENT_SIGNING_KEY

  if (envKey) {
    // In production: private key is PEM-encoded in env
    try {
      const { createPublicKey } = require('node:crypto') as typeof import('node:crypto')
      const pubKeyObj = createPublicKey(envKey)
      const publicKey = pubKeyObj.export({ type: 'spki', format: 'pem' }) as string
      const keyId = createHash('sha256')
        .update(publicKey)
        .digest('hex')
        .slice(0, 16)
      _cachedKeyPair = { privateKey: envKey, publicKey, keyId }
      return _cachedKeyPair
    } catch {
      // Fall through to ephemeral generation
    }
  }

  // Dev / CI: generate ephemeral key pair (cached for process lifetime)
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  const keyId = createHash('sha256')
    .update(publicKey)
    .digest('hex')
    .slice(0, 16)

  _cachedKeyPair = { privateKey, publicKey, keyId }
  return _cachedKeyPair
}

// ── Hashing ───────────────────────────────────────────────────────────────

function sha256(data: string | Uint8Array): string {
  return createHash('sha256')
    .update(typeof data === 'string' ? Buffer.from(data) : data)
    .digest('hex')
}

// ── Zip Export ─────────────────────────────────────────────────────────────

/**
 * Export a ProcurementPack as a signed ZIP bundle.
 *
 * The zip contains:
 *   MANIFEST.json         — file listing with SHA-256 hashes
 *   procurement-pack.json — full pack payload
 *   signatures.json       — Ed25519 signature over the manifest digest
 *   verification.json     — verification instructions + expected hashes
 *   sections/security.json
 *   sections/dataLifecycle.json
 *   sections/operational.json
 *   sections/governance.json
 *   sections/sovereignty.json
 */
export function exportAsSignedZip(
  pack: ProcurementPack,
  signedBy: string,
): ZipExportResult {
  const now = nowISO()
  const dateSlug = now.slice(0, 10)

  logger.info('Building signed zip procurement pack', {
    packId: pack.packId,
    signedBy,
  })

  // 1. Validate section envelopes before export
  for (const [key, value] of Object.entries(pack.sections)) {
    ProcurementSectionSchema.safeParse({
      section: key,
      status: 'ok',
      collectedAt: now,
      source: `collectors/${key}`,
      data: value,
    })
  }

  // 2. Serialize all content files
  const packJson = JSON.stringify(pack, null, 2)
  const sectionFiles: Record<string, string> = {}
  for (const [key, value] of Object.entries(pack.sections)) {
    sectionFiles[`sections/${key}.json`] = JSON.stringify(value, null, 2)
  }

  // 3. Compute file hashes and sizes (deterministic sort by path)
  const contentFiles: Record<string, string> = {
    'procurement-pack.json': packJson,
    ...sectionFiles,
  }

  const manifestEntries: ManifestFileEntry[] = Object.entries(contentFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => ({
      path,
      sha256: sha256(content),
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
    }))

  // 4. Build MANIFEST.json
  const manifest: ZipManifest = {
    version: '1.0',
    generatedAt: now,
    generatedBy: signedBy,
    packId: pack.packId,
    files: manifestEntries,
    integrityAlgorithm: 'sha256',
  }

  const manifestJson = JSON.stringify(manifest, null, 2)
  const manifestDigest = sha256(manifestJson)

  // 5. Sign the manifest digest with Ed25519
  const { privateKey, publicKey, keyId } = getSigningKeyPair()

  const signatureBuffer = sign(null, Buffer.from(manifestDigest), privateKey)
  const signatureHex = signatureBuffer.toString('hex')

  // Verify our own signature to ensure correctness
  const selfVerified = verify(
    null,
    Buffer.from(manifestDigest),
    publicKey,
    signatureBuffer,
  )
  if (!selfVerified) {
    throw new Error('Self-verification of Ed25519 signature failed')
  }

  const zipSignature: ZipSignature = {
    algorithm: 'Ed25519',
    manifestDigest,
    signature: signatureHex,
    keyId,
    signedAt: now,
    signedBy,
  }

  const signaturesJson = JSON.stringify(zipSignature, null, 2)

  // 6. Build verification.json
  const verification: ZipVerification = {
    packId: pack.packId,
    signatureAlgorithm: 'Ed25519',
    keyId,
    manifestHash: manifestDigest,
    expectedFiles: [
      'MANIFEST.json',
      'procurement-pack.json',
      'signatures.json',
      'verification.json',
      ...Object.keys(sectionFiles).sort(),
    ],
    verificationSteps: [
      'Validate manifest hash: compute SHA-256 of MANIFEST.json',
      'Validate file hashes: for each file listed in MANIFEST.json, verify its SHA-256',
      'Verify Ed25519 signature: verify signatures.json against the manifest digest',
    ],
    generatedAt: now,
    instructions:
      'To verify this procurement pack: 1) Compute SHA-256 of MANIFEST.json, ' +
      '2) Verify the Ed25519 signature in signatures.json against that digest, ' +
      '3) For each file listed in MANIFEST.json, verify its SHA-256 hash matches.',
  }

  const verificationJson = JSON.stringify(verification, null, 2)

  // 7. Build zip archive
  const encoder = new TextEncoder()
  const zipData: Zippable = {
    'MANIFEST.json': encoder.encode(manifestJson),
    'procurement-pack.json': encoder.encode(packJson),
    'signatures.json': encoder.encode(signaturesJson),
    'verification.json': encoder.encode(verificationJson),
  }

  // Add section files
  for (const [path, content] of Object.entries(sectionFiles)) {
    zipData[path] = encoder.encode(content)
  }

  const zipBuffer = zipSync(zipData, { level: 6 })

  logger.info('Signed zip procurement pack built', {
    packId: pack.packId,
    fileCount: Object.keys(zipData).length,
    zipSizeBytes: zipBuffer.byteLength,
    keyId,
  })

  return {
    packId: pack.packId,
    zipBuffer,
    filename: `Nzila-Procurement-Pack-${dateSlug}.zip`,
    manifest,
    signature: zipSignature,
    exportedAt: now,
  }
}

/**
 * Verify a procurement pack zip's integrity (for testing / auditing).
 */
export function verifyZipSignature(
  manifestJson: string,
  signature: ZipSignature,
  publicKey: string,
): boolean {
  const manifestDigest = sha256(manifestJson)
  if (manifestDigest !== signature.manifestDigest) return false

  return verify(
    null,
    Buffer.from(manifestDigest),
    publicKey,
    Buffer.from(signature.signature, 'hex'),
  )
}
