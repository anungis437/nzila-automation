/**
 * @nzila/platform-evidence-pack — Exporter
 *
 * Exports sealed evidence packs to portable formats (JSON, ZIP).
 * Includes all artifacts and cryptographic seals.
 *
 * @module @nzila/platform-evidence-pack/exporter
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  EvidencePackIndex,
  ExportFormat,
  ExportResult,
  ExporterPorts,
} from './types'

const logger = createLogger('evidence-exporter')

/**
 * Export an evidence pack to a portable format.
 */
export async function exportPack(
  pack: EvidencePackIndex,
  format: ExportFormat,
  ports: ExporterPorts,
): Promise<ExportResult> {
  if (!pack.seal) {
    throw new Error(`Cannot export unsealed evidence pack '${pack.packId}'`)
  }

  logger.info('Exporting evidence pack', {
    packId: pack.packId,
    format,
    artifactCount: pack.artifacts.length,
  })

  if (format === 'json') {
    return exportAsJson(pack)
  }

  return exportAsZipBundle(pack, ports)
}

// ── JSON Export ──────────────────────────────────────────────────────────────

async function exportAsJson(pack: EvidencePackIndex): Promise<ExportResult> {
  const jsonString = JSON.stringify(pack, null, 2)

  return {
    packId: pack.packId,
    format: 'json',
    data: jsonString,
    exportedAt: new Date().toISOString(),
    artifactCount: pack.artifacts.length,
  }
}

// ── ZIP Bundle Export ───────────────────────────────────────────────────────

async function exportAsZipBundle(
  pack: EvidencePackIndex,
  ports: ExporterPorts,
): Promise<ExportResult> {
  // Build a simple bundle structure (artifact content + index)
  // In production this would use archiver/JSZip, but for now we produce a
  // JSON manifest with base64-encoded artifact content
  const bundle: ExportBundle = {
    index: pack,
    artifacts: [],
  }

  for (const artifact of pack.artifacts) {
    try {
      const content = await ports.readBlob(artifact.blobPath)
      bundle.artifacts.push({
        artifactId: artifact.artifactId,
        content: content.toString('base64'),
        sha256: artifact.sha256,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn('Failed to read artifact blob', {
        packId: pack.packId,
        artifactId: artifact.artifactId,
        error: msg,
      })
      bundle.artifacts.push({
        artifactId: artifact.artifactId,
        content: null,
        sha256: artifact.sha256,
        error: msg,
      })
    }
  }

  const data = JSON.stringify(bundle, null, 2)

  return {
    packId: pack.packId,
    format: 'zip',
    data,
    exportedAt: new Date().toISOString(),
    artifactCount: pack.artifacts.length,
  }
}

// ── Internal Types ──────────────────────────────────────────────────────────

interface ExportBundle {
  readonly index: EvidencePackIndex
  artifacts: ExportBundleArtifact[]
}

interface ExportBundleArtifact {
  readonly artifactId: string
  readonly content: string | null
  readonly sha256: string
  readonly error?: string
}
