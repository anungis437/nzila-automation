/**
 * Nzila OS — Release Attestation Generator
 *
 * Generates a `release-attestation.json` artifact that captures the full
 * security and quality posture at deploy time. This artifact is uploaded
 * alongside every pilot/prod deploy to create a tamper-evident release record.
 *
 * Contents:
 *   - Commit SHA
 *   - Contract test result (pass/fail)
 *   - SLO gate result (pass/fail)
 *   - SBOM digest (if available)
 *   - Trivy scan summary
 *   - Secret scan summary
 *   - Timestamp + attestation hash
 *
 * Usage:
 *   npx tsx scripts/release-attestation.ts --sha <commit-sha> [--contract-pass] [--slo-pass]
 *
 * @module scripts/release-attestation
 */
import { createHash } from 'node:crypto'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReleaseAttestation {
  /** Schema version */
  version: '1.0'
  /** Git commit SHA being deployed */
  commitSha: string
  /** Whether contract tests passed */
  contractTestResult: 'pass' | 'fail' | 'skipped'
  /** Whether SLO gate passed */
  sloGateResult: 'pass' | 'fail' | 'skipped'
  /** SHA-256 digest of the SBOM file (null if not available) */
  sbomDigest: string | null
  /** Trivy vulnerability scan summary */
  trivySummary: TrivySummary
  /** Secret scan summary */
  secretScanSummary: SecretScanSummary
  /** ISO 8601 timestamp of attestation generation */
  timestamp: string
  /** Target environment */
  environment: string
  /** SHA-256 digest of this attestation (excluding this field) */
  attestationDigest: string
}

export interface TrivySummary {
  /** Whether Trivy scan completed */
  ran: boolean
  /** Number of critical vulnerabilities */
  critical: number
  /** Number of high vulnerabilities */
  high: number
  /** Number of medium vulnerabilities */
  medium: number
  /** Number of low vulnerabilities */
  low: number
}

export interface SecretScanSummary {
  /** Whether secret scan completed */
  ran: boolean
  /** Number of findings */
  findings: number
  /** Whether all findings are resolved/waived */
  clean: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '..')

function readJsonSafe<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T
  } catch {
    return null
  }
}

function computeSbomDigest(): string | null {
  const sbomPaths = [
    join(ROOT, 'sbom.json'),
    join(ROOT, 'sbom.spdx.json'),
    join(ROOT, 'sbom.cdx.json'),
  ]
  for (const p of sbomPaths) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf-8')
      return createHash('sha256').update(content).digest('hex')
    }
  }
  return null
}

function parseTrivyResults(): TrivySummary {
  const trivyPaths = [
    join(ROOT, 'trivy-results.json'),
    join(ROOT, 'trivy-report.json'),
  ]

  for (const p of trivyPaths) {
    const data = readJsonSafe<{ Results?: Array<{ Vulnerabilities?: Array<{ Severity: string }> }> }>(p)
    if (data?.Results) {
      const counts = { critical: 0, high: 0, medium: 0, low: 0 }
      for (const result of data.Results) {
        for (const vuln of result.Vulnerabilities ?? []) {
          const sev = vuln.Severity?.toLowerCase() as keyof typeof counts
          if (sev in counts) counts[sev]++
        }
      }
      return { ran: true, ...counts }
    }
  }

  return { ran: false, critical: 0, high: 0, medium: 0, low: 0 }
}

function parseSecretScanResults(): SecretScanSummary {
  const scanPaths = [
    join(ROOT, 'gitleaks-report.json'),
    join(ROOT, 'secret-scan-results.json'),
  ]

  for (const p of scanPaths) {
    const data = readJsonSafe<Array<Record<string, unknown>>>(p)
    if (Array.isArray(data)) {
      return {
        ran: true,
        findings: data.length,
        clean: data.length === 0,
      }
    }
  }

  return { ran: false, findings: 0, clean: true }
}

function computeAttestationDigest(attestation: Omit<ReleaseAttestation, 'attestationDigest'>): string {
  const canonical = JSON.stringify(attestation, Object.keys(attestation).sort(), 0)
  return createHash('sha256').update(canonical).digest('hex')
}

// ── Generator ─────────────────────────────────────────────────────────────

export interface GenerateAttestationOptions {
  commitSha: string
  contractTestResult?: 'pass' | 'fail' | 'skipped'
  sloGateResult?: 'pass' | 'fail' | 'skipped'
  environment?: string
}

export function generateReleaseAttestation(opts: GenerateAttestationOptions): ReleaseAttestation {
  const base: Omit<ReleaseAttestation, 'attestationDigest'> = {
    version: '1.0',
    commitSha: opts.commitSha,
    contractTestResult: opts.contractTestResult ?? 'skipped',
    sloGateResult: opts.sloGateResult ?? 'skipped',
    sbomDigest: computeSbomDigest(),
    trivySummary: parseTrivyResults(),
    secretScanSummary: parseSecretScanResults(),
    timestamp: new Date().toISOString(),
    environment: opts.environment ?? 'unknown',
  }

  return {
    ...base,
    attestationDigest: computeAttestationDigest(base),
  }
}

// ── CLI Entry ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): GenerateAttestationOptions {
  let commitSha = ''
  let contractTestResult: 'pass' | 'fail' | 'skipped' = 'skipped'
  let sloGateResult: 'pass' | 'fail' | 'skipped' = 'skipped'
  let environment = 'unknown'

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--sha' && argv[i + 1]) {
      commitSha = argv[++i]
    } else if (arg === '--contract-pass') {
      contractTestResult = 'pass'
    } else if (arg === '--contract-fail') {
      contractTestResult = 'fail'
    } else if (arg === '--slo-pass') {
      sloGateResult = 'pass'
    } else if (arg === '--slo-fail') {
      sloGateResult = 'fail'
    } else if (arg === '--env' && argv[i + 1]) {
      environment = argv[++i]
    }
  }

  if (!commitSha) {
    console.error('Usage: release-attestation.ts --sha <commit-sha> [--contract-pass|--contract-fail] [--slo-pass|--slo-fail] [--env <env>]')
    process.exit(1)
  }

  return { commitSha, contractTestResult, sloGateResult, environment }
}

// Only run when executed directly (not imported)
const isDirectExecution = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/release-attestation.ts')
  || process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/release-attestation')

if (isDirectExecution) {
  const opts = parseArgs(process.argv.slice(2))
  const attestation = generateReleaseAttestation(opts)
  const outPath = join(ROOT, 'release-attestation.json')
  writeFileSync(outPath, JSON.stringify(attestation, null, 2) + '\n', 'utf-8')
  console.log(`✓ Release attestation written to ${outPath}`)
  console.log(`  Commit:    ${attestation.commitSha}`)
  console.log(`  Contract:  ${attestation.contractTestResult}`)
  console.log(`  SLO:       ${attestation.sloGateResult}`)
  console.log(`  SBOM:      ${attestation.sbomDigest ?? '(not found)'}`)
  console.log(`  Trivy:     ${attestation.trivySummary.ran ? `C:${attestation.trivySummary.critical} H:${attestation.trivySummary.high} M:${attestation.trivySummary.medium} L:${attestation.trivySummary.low}` : '(not run)'}`)
  console.log(`  Secrets:   ${attestation.secretScanSummary.ran ? (attestation.secretScanSummary.clean ? 'clean' : `${attestation.secretScanSummary.findings} finding(s)`) : '(not run)'}`)
  console.log(`  Digest:    ${attestation.attestationDigest}`)
}
