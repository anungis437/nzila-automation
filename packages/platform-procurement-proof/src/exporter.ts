/**
 * @nzila/platform-procurement-proof — Exporter
 *
 * Exports a ProcurementPack as JSON or a Procurement Pack ZIP bundle
 * with MANIFEST + signatures for procurement teams.
 *
 * @module @nzila/platform-procurement-proof/exporter
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import { nowISO } from '@nzila/platform-utils/time'
import type { ProcurementPack } from './types'

const logger = createLogger('procurement-proof-exporter')

export interface ProcurementExportResult {
  readonly packId: string
  readonly format: 'json' | 'zip'
  readonly data: string
  readonly exportedAt: string
  readonly filename: string
}

/**
 * Export a procurement pack as a JSON bundle.
 */
export function exportAsJson(pack: ProcurementPack): ProcurementExportResult {
  logger.info('Exporting procurement pack as JSON', { packId: pack.packId })

  const data = JSON.stringify(
    {
      MANIFEST: pack.manifest,
      SIGNATURE: pack.signature ?? null,
      pack,
    },
    null,
    2,
  )

  return {
    packId: pack.packId,
    format: 'json',
    data,
    exportedAt: nowISO(),
    filename: `procurement-pack-${pack.packId}.json`,
  }
}

/**
 * Export a procurement pack as a ZIP-style bundle (JSON manifest + sections).
 * Uses a JSON container with base64-encoded section blobs to simulate ZIP
 * without a heavy archiver dependency.
 */
export function exportAsBundle(pack: ProcurementPack): ProcurementExportResult {
  logger.info('Exporting procurement pack as bundle', { packId: pack.packId })

  const sections: Record<string, string> = {}
  for (const [key, value] of Object.entries(pack.sections)) {
    const json = JSON.stringify(value, null, 2)
    sections[`${key}.json`] = Buffer.from(json).toString('base64')
  }

  const manifestJson = JSON.stringify(pack.manifest, null, 2)
  const signatureJson = pack.signature
    ? JSON.stringify(pack.signature, null, 2)
    : null

  const bundle = {
    'MANIFEST.json': Buffer.from(manifestJson).toString('base64'),
    ...(signatureJson
      ? { 'SIGNATURE.json': Buffer.from(signatureJson).toString('base64') }
      : {}),
    ...Object.fromEntries(
      Object.entries(sections).map(([k, v]) => [`sections/${k}`, v]),
    ),
    'INTEGRITY.sha256': Buffer.from(
      createHash('sha256')
        .update(JSON.stringify(pack))
        .digest('hex'),
    ).toString('base64'),
  }

  const data = JSON.stringify(bundle, null, 2)

  return {
    packId: pack.packId,
    format: 'zip',
    data,
    exportedAt: nowISO(),
    filename: `Procurement-Pack-${pack.packId}.zip`,
  }
}
