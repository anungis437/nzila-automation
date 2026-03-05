/**
 * Nzila OS — Procurement Section: Build Attestation
 *
 * Section collector that embeds build attestation data into
 * the procurement pack. Conforms to ProcurementSectionSchema.
 *
 * @module @nzila/platform-procurement-proof/sections/build-attestation
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { nowISO } from '@nzila/platform-utils/time'
import type { ProcurementSection } from '../schemas/section.schema'

const ROOT = resolve(import.meta.dirname ?? __dirname, '..', '..', '..', '..')

interface BuildAttestationData {
  readonly commitHash: string
  readonly buildTimestamp: string
  readonly nodeVersion: string
  readonly pnpmVersion: string
  readonly sbomHash: string | null
  readonly lockfileHash: string
  readonly isSigned: boolean
  readonly attestationDigest: string
}

export function collectBuildAttestation(): ProcurementSection {
  const attestPath = resolve(ROOT, 'ops', 'security', 'build-attestation.json')

  if (!existsSync(attestPath)) {
    return {
      section: 'build_attestation',
      status: 'not_available',
      collectedAt: nowISO(),
      source: '@nzila/platform-procurement-proof/sections/build-attestation',
      data: { reason: 'Build attestation not found. Run: npx tsx scripts/attest-build.ts' },
    }
  }

  try {
    const content = readFileSync(attestPath, 'utf-8')
    const attestation = JSON.parse(content) as {
      commitHash?: string
      buildTimestamp?: string
      nodeVersion?: string
      pnpmVersion?: string
      sbomHash?: string | null
      lockfileHash?: string
      signature?: string | null
      attestationDigest?: string
    }

    const data: BuildAttestationData = {
      commitHash: attestation.commitHash ?? 'unknown',
      buildTimestamp: attestation.buildTimestamp ?? 'unknown',
      nodeVersion: attestation.nodeVersion ?? 'unknown',
      pnpmVersion: attestation.pnpmVersion ?? 'unknown',
      sbomHash: attestation.sbomHash ?? null,
      lockfileHash: attestation.lockfileHash ?? 'unknown',
      isSigned: Boolean(attestation.signature),
      attestationDigest: attestation.attestationDigest ?? createHash('sha256').update(content).digest('hex'),
    }

    return {
      section: 'build_attestation',
      status: 'ok',
      collectedAt: nowISO(),
      source: '@nzila/platform-procurement-proof/sections/build-attestation',
      data,
    }
  } catch {
    return {
      section: 'build_attestation',
      status: 'not_available',
      collectedAt: nowISO(),
      source: '@nzila/platform-procurement-proof/sections/build-attestation',
      data: { reason: 'Failed to parse build attestation JSON' },
    }
  }
}
