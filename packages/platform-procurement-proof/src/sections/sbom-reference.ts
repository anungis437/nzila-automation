/**
 * Nzila OS — Procurement Section: SBOM Reference
 *
 * Collects a lightweight reference to the most recent CycloneDX SBOM:
 *   - SHA-256 digest of ops/security/sbom.json
 *   - CycloneDX spec version + component count
 *   - Generation timestamp from SBOM metadata
 *
 * The actual SBOM is archived separately as a CI artifact. This section
 * proves the procurement pack was built against a specific, verifiable
 * SBOM snapshot.
 *
 * @module @nzila/platform-procurement-proof/sections/sbom-reference
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { nowISO } from '@nzila/platform-utils/time'
import type { ProcurementSection } from '../schemas/section.schema'

const ROOT = resolve(import.meta.dirname ?? __dirname, '..', '..', '..', '..')
const SBOM_PATH = resolve(ROOT, 'ops', 'security', 'sbom.json')

interface SbomReference {
  readonly sbomPath: string
  readonly sha256: string
  readonly bomFormat: string
  readonly specVersion: string
  readonly componentCount: number
  readonly generatedAt: string
  readonly serialNumber: string | null
}

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex')
}

export function collectSBOMReference(): ProcurementSection {
  if (!existsSync(SBOM_PATH)) {
    return {
      section: 'sbom_reference',
      status: 'not_available',
      collectedAt: nowISO(),
      source: '@nzila/platform-procurement-proof/sections/sbom-reference',
      data: { reason: 'SBOM file not found at ops/security/sbom.json' },
    }
  }

  const raw = readFileSync(SBOM_PATH, 'utf-8')
  const parsed = JSON.parse(raw) as {
    bomFormat?: string
    specVersion?: string
    serialNumber?: string
    components?: unknown[]
    metadata?: { timestamp?: string }
  }

  const ref: SbomReference = {
    sbomPath: 'ops/security/sbom.json',
    sha256: sha256(raw),
    bomFormat: parsed.bomFormat ?? 'unknown',
    specVersion: parsed.specVersion ?? 'unknown',
    componentCount: parsed.components?.length ?? 0,
    generatedAt: parsed.metadata?.timestamp ?? 'unknown',
    serialNumber: parsed.serialNumber ?? null,
  }

  return {
    section: 'sbom_reference',
    status: 'ok',
    collectedAt: nowISO(),
    source: '@nzila/platform-procurement-proof/sections/sbom-reference',
    data: ref,
  }
}
