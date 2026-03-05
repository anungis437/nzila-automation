/**
 * Nzila OS — Procurement Section: Supply Chain Integrity
 *
 * Section collector for SBOM and supply chain evidence.
 * Conforms to ProcurementSectionSchema envelope.
 *
 * @module @nzila/platform-procurement-proof/sections/supply-chain-integrity
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { nowISO } from '@nzila/platform-utils/time'
import type { ProcurementSection } from '../schemas/section.schema'

const ROOT = resolve(import.meta.dirname ?? __dirname, '..', '..', '..', '..')

interface SbomMetadata {
  readonly bomFormat: string
  readonly specVersion: string
  readonly componentCount: number
  readonly generatedAt: string
  readonly sbomHash: string
}

interface SupplyChainData {
  readonly sbom: SbomMetadata | null
  readonly lockfileHash: string | null
  readonly licensePolicy: 'enforced' | 'not_configured'
  readonly vulnerabilityWaivers: 'present' | 'none'
}

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex')
}

export function collectSupplyChainIntegrity(): ProcurementSection {
  const sbomPath = resolve(ROOT, 'ops', 'security', 'sbom.json')
  const lockPath = resolve(ROOT, 'pnpm-lock.yaml')
  const policyPath = resolve(ROOT, 'tooling', 'security', 'supply-chain-policy.ts')

  let sbom: SbomMetadata | null = null
  if (existsSync(sbomPath)) {
    const content = readFileSync(sbomPath, 'utf-8')
    const parsed = JSON.parse(content) as {
      bomFormat?: string
      specVersion?: string
      components?: unknown[]
      metadata?: { timestamp?: string }
    }
    sbom = {
      bomFormat: parsed.bomFormat ?? 'unknown',
      specVersion: parsed.specVersion ?? 'unknown',
      componentCount: parsed.components?.length ?? 0,
      generatedAt: parsed.metadata?.timestamp ?? 'unknown',
      sbomHash: sha256(content),
    }
  }

  const lockfileHash = existsSync(lockPath)
    ? sha256(readFileSync(lockPath, 'utf-8'))
    : null

  const data: SupplyChainData = {
    sbom,
    lockfileHash,
    licensePolicy: existsSync(policyPath) ? 'enforced' : 'not_configured',
    vulnerabilityWaivers: existsSync(policyPath) ? 'present' : 'none',
  }

  return {
    section: 'supply_chain_integrity',
    status: sbom ? 'ok' : 'not_available',
    collectedAt: nowISO(),
    source: '@nzila/platform-procurement-proof/sections/supply-chain-integrity',
    data,
  }
}
