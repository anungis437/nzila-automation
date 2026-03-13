/**
 * Nzila OS — Platform Ops: Pilot Summary Pack
 *
 * Upgrades the pilot export into a procurement-ready "Pilot Summary Pack"
 * with MANIFEST.json containing per-section SHA-256 hashes.
 *
 * Output: a structured bundle containing attestation, SLO, lifecycle,
 * integrity, digest, isolation proof, plus a verifiable manifest.
 *
 * @module @nzila/platform-ops/pilot-pack
 */
import {
  generatePilotSummary,
  type PilotExportPorts,
  type PilotSummaryBundle,
} from './pilot-export'

// ── Types ──────────────────────────────────────────────────────────────────

export interface ManifestEntry {
  /** Section name */
  section: string
  /** SHA-256 hash of the section JSON */
  hash: string
  /** Byte size of the section JSON */
  sizeBytes: number
}

export interface PackManifest {
  /** Pack format version */
  formatVersion: string
  /** When the manifest was generated */
  generatedAt: string
  /** Platform name */
  platformName: string
  /** Per-section hashes */
  sections: ManifestEntry[]
  /** SHA-256 of the full bundle (matches PilotSummaryBundle.signatureHash) */
  bundleHash: string
  /** Total pack size in bytes */
  totalSizeBytes: number
}

export interface PilotSummaryPack {
  /** The full pilot summary bundle */
  bundle: PilotSummaryBundle
  /** The verifiable manifest with per-section hashes */
  manifest: PackManifest
  /** Pack metadata */
  metadata: {
    generatedAt: string
    formatVersion: string
    sectionCount: number
    bundleHash: string
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const PACK_FORMAT_VERSION = '2.0.0'

// ── Hash Helper ────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 for a single section's JSON content.
 */
async function hashSection(content: unknown): Promise<{ hash: string; sizeBytes: number }> {
  const json = JSON.stringify(content, null, 0)
  const bytes = new TextEncoder().encode(json).length
  const { createHash } = await import('node:crypto')
  const hash = createHash('sha256').update(json).digest('hex')
  return { hash: `sha256:${hash}`, sizeBytes: bytes }
}

// ── Pack Assembly ──────────────────────────────────────────────────────────

/**
 * Generate a complete Pilot Summary Pack with manifest.
 *
 * Builds on `generatePilotSummary()` and adds:
 * - Per-section SHA-256 hashes in MANIFEST.json
 * - Pack metadata for procurement verification
 */
export async function generatePilotPack(
  ports: PilotExportPorts,
): Promise<PilotSummaryPack> {
  const bundle = await generatePilotSummary(ports)

  // Compute per-section hashes
  const sectionEntries: Array<{ name: string; data: unknown }> = [
    { name: 'release', data: bundle.release },
    { name: 'slo', data: bundle.slo },
    { name: 'lifecycle', data: bundle.lifecycle },
    { name: 'integrity', data: bundle.integrity },
    { name: 'opsDigest', data: bundle.opsDigest },
    { name: 'isolation', data: bundle.isolation },
  ]

  const manifestSections: ManifestEntry[] = []
  let totalSize = 0

  for (const entry of sectionEntries) {
    const { hash, sizeBytes } = await hashSection(entry.data)
    manifestSections.push({ section: entry.name, hash, sizeBytes })
    totalSize += sizeBytes
  }

  const generatedAt = new Date().toISOString()

  const manifest: PackManifest = {
    formatVersion: PACK_FORMAT_VERSION,
    generatedAt,
    platformName: bundle.platformName,
    sections: manifestSections,
    bundleHash: bundle.signatureHash,
    totalSizeBytes: totalSize,
  }

  return {
    bundle,
    manifest,
    metadata: {
      generatedAt,
      formatVersion: PACK_FORMAT_VERSION,
      sectionCount: manifestSections.length,
      bundleHash: bundle.signatureHash,
    },
  }
}

/**
 * Verify that a manifest's section hashes match the bundle content.
 * Returns a list of mismatched sections (empty = all valid).
 */
export async function verifyManifest(
  bundle: PilotSummaryBundle,
  manifest: PackManifest,
): Promise<string[]> {
  const mismatches: string[] = []

  const sectionMap: Record<string, unknown> = {
    release: bundle.release,
    slo: bundle.slo,
    lifecycle: bundle.lifecycle,
    integrity: bundle.integrity,
    opsDigest: bundle.opsDigest,
    isolation: bundle.isolation,
  }

  for (const entry of manifest.sections) {
    const data = sectionMap[entry.section]
    if (!data) {
      mismatches.push(entry.section)
      continue
    }
    const { hash } = await hashSection(data)
    if (hash !== entry.hash) {
      mismatches.push(entry.section)
    }
  }

  return mismatches
}
