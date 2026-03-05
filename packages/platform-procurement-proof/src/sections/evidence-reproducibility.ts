/**
 * Nzila OS — Procurement Section: Evidence Reproducibility
 *
 * Section collector that reports on the reproducibility status
 * of the evidence system. Conforms to ProcurementSectionSchema.
 *
 * @module @nzila/platform-procurement-proof/sections/evidence-reproducibility
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { nowISO } from '@nzila/platform-utils/time'
import type { ProcurementSection } from '../schemas/section.schema'

const ROOT = resolve(import.meta.dirname ?? __dirname, '..', '..', '..', '..')

interface ReproducibilityData {
  readonly evidencePackagePresent: boolean
  readonly complianceSnapshotsPresent: boolean
  readonly procurementProofPresent: boolean
  readonly sbomPresent: boolean
  readonly buildAttestationPresent: boolean
  readonly reproducibilityScore: number
  readonly verificationCommand: string
}

export function collectEvidenceReproducibility(): ProcurementSection {
  const checks = {
    evidencePackagePresent: existsSync(resolve(ROOT, 'packages', 'platform-evidence-pack', 'package.json')),
    complianceSnapshotsPresent: existsSync(resolve(ROOT, 'packages', 'platform-compliance-snapshots', 'package.json')),
    procurementProofPresent: existsSync(resolve(ROOT, 'packages', 'platform-procurement-proof', 'package.json')),
    sbomPresent: existsSync(resolve(ROOT, 'ops', 'security', 'sbom.json')),
    buildAttestationPresent: existsSync(resolve(ROOT, 'ops', 'security', 'build-attestation.json')),
  }

  const total = Object.keys(checks).length
  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / total) * 100)

  const data: ReproducibilityData = {
    ...checks,
    reproducibilityScore: score,
    verificationCommand: 'pnpm reproduce:evidence',
  }

  return {
    section: 'evidence_reproducibility',
    status: score >= 60 ? 'ok' : 'not_available',
    collectedAt: nowISO(),
    source: '@nzila/platform-procurement-proof/sections/evidence-reproducibility',
    data,
  }
}
