/**
 * Nzila OS — Golden Demo Path
 *
 * End-to-end demonstration that always works. Deterministic,
 * no secrets, no external dependencies.
 *
 * Steps:
 *   1. Create org context
 *   2. Generate compliance snapshot + chain entry
 *   3. Generate evidence pack
 *   4. Export signed procurement pack ZIP
 *   5. Generate RFP response
 *   6. Print verification results
 *
 * Usage:
 *   pnpm demo:golden
 *   npx tsx scripts/demo-golden-path.ts
 *
 * @module scripts/demo-golden-path
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

import {
  collectProcurementPack,
  signProcurementPack,
  exportAsSignedZip,
  exportAsJson,
  createRealPorts,
  getSigningKeyPair,
} from '@nzila/platform-procurement-proof'
import type { RealPortsDeps } from '@nzila/platform-procurement-proof/real-ports'
import type { EvidencePackIndex } from '@nzila/platform-evidence-pack'
import type { ComplianceSnapshot, SnapshotChainEntry } from '@nzila/platform-compliance-snapshots'
import type { HealthReport } from '@nzila/platform-observability'
import { computeAssuranceDashboard } from '@nzila/platform-assurance'
import type { AssurancePorts } from '@nzila/platform-assurance/types'
import { generateRfpResponse, renderRfpMarkdown } from '@nzila/platform-rfp-generator'

// ── Config ──────────────────────────────────────────────────────────────────

const ORG_ID = 'demo-org'
const DEMO_USER = 'demo-golden-path'
const OUTPUT_DIR = join(process.cwd(), 'demo-output')

// ── Step helpers ────────────────────────────────────────────────────────────

function step(n: number, label: string) {
  // eslint-disable-next-line no-console -- CLI script
  console.log(`\n[${'='.repeat(60)}]`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Step ${n}: ${label}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`[${'='.repeat(60)}]`)
}

// ── Port Setup ──────────────────────────────────────────────────────────────

function createDemoPortDeps(): RealPortsDeps {
  const now = new Date().toISOString()
  const packId = randomUUID()

  // Pre-seed an evidence pack
  const evidencePack: EvidencePackIndex = {
    packId,
    orgId: ORG_ID,
    status: 'sealed',
    createdAt: now,
    sealedAt: now,
    artifacts: [
      {
        artifactId: randomUUID(),
        type: 'security-posture',
        data: { source: 'dependency-audit', status: 'clean' },
        createdAt: now,
        sha256: createHash('sha256').update('demo-security').digest('hex'),
      },
      {
        artifactId: randomUUID(),
        type: 'governance-snapshot',
        data: { source: 'compliance-collector', policyRate: 100 },
        createdAt: now,
        sha256: createHash('sha256').update('demo-governance').digest('hex'),
      },
    ],
    seal: {
      merkleRoot: createHash('sha256').update('demo-merkle').digest('hex'),
      algorithm: 'sha256',
      sealedAt: now,
      sealedBy: DEMO_USER,
    },
  }

  // Pre-seed a compliance snapshot + chain entry
  const snapshotId = randomUUID()
  const snapshotHash = createHash('sha256').update(JSON.stringify({
    snapshotId,
    orgId: ORG_ID,
    status: 'compliant',
  })).digest('hex')

  const snapshot: ComplianceSnapshot = {
    snapshotId,
    orgId: ORG_ID,
    generatedAt: now,
    generatedBy: DEMO_USER,
    status: 'compliant',
    controls: [
      { controlId: 'access-01', family: 'access', description: 'RBAC enforced', status: 'pass', evidenceRef: 'rbac-config' },
      { controlId: 'data-01', family: 'data', description: 'Encryption at rest', status: 'pass', evidenceRef: 'encryption-policy' },
      { controlId: 'financial-01', family: 'financial', description: 'Budget gates active', status: 'pass', evidenceRef: 'cost-policy' },
      { controlId: 'operational-01', family: 'operational', description: 'SLO monitoring', status: 'pass', evidenceRef: 'slo-policy' },
    ],
    summary: {
      totalControls: 4,
      passing: 4,
      failing: 0,
      warnings: 0,
      complianceRate: 100,
    },
  }

  const chainEntry: SnapshotChainEntry = {
    snapshotId,
    hash: snapshotHash,
    previousHash: null,
    chainIndex: 0,
    createdAt: now,
  }

  return {
    evidencePack: {
      async listPacks(_orgId: string) { return [evidencePack] },
      async loadPack(_packId: string) { return evidencePack },
    },
    complianceSnapshots: {
      async listSnapshots(_orgId: string) { return [snapshot] },
      async loadChain(_orgId: string) { return [chainEntry] },
    },
    integrations: {
      async listProviders() { return ['slack', 'hubspot'] },
      async getCircuitState() { return 'closed' as const },
      async getDeliveryStats() { return { total: 150, succeeded: 149, failed: 1, avgLatencyMs: 120 } },
      async getDlqDepth() { return 0 },
    },
    observability: {
      async runHealthChecks(): Promise<HealthReport> {
        return {
          service: 'nzila-os',
          status: 'healthy',
          checks: [
            { name: 'database', status: 'healthy', responseTimeMs: 12, checkedAt: now },
            { name: 'cache', status: 'healthy', responseTimeMs: 3, checkedAt: now },
          ],
          timestamp: now,
        }
      },
    },
    sovereignty: {
      deploymentRegion: 'Canada Central',
      dataResidency: 'Canada',
      regulatoryFrameworks: ['PIPEDA', 'Québec Law 25'],
      crossBorderTransfer: false,
    },
  }
}

function createDemoAssurancePorts(): AssurancePorts {
  return {
    async getComplianceScore() {
      return { score: 97, grade: 'A' as const, snapshotChainVerified: true, policyComplianceRate: 100, controlFamiliesCovered: 4, controlFamiliesTotal: 4, lastSnapshotAt: new Date().toISOString() }
    },
    async getSecurityScore() {
      return { score: 92, grade: 'A' as const, criticalVulnerabilities: 0, highVulnerabilities: 0, dependencyPosture: 92, attestationValid: true, lockfileIntegrity: true, lastScanAt: new Date().toISOString() }
    },
    async getOpsScore() {
      return { score: 91, grade: 'A' as const, confidenceScore: 91, sloComplianceRate: 99.2, p95Ms: 320, errorRate: 0.3, uptimePercent: 99.5, trendDirection: 'stable' as const, incidentCount: 0 }
    },
    async getCostScore() {
      return { score: 84, grade: 'B' as const, budgetUtilization: 0.84, dailySpendUsd: 140, monthlySpendUsd: 4200, monthlyBudgetUsd: 5000, overBudget: false, categoriesOverCap: [] }
    },
    async getIntegrationReliabilityScore() {
      return { score: 90, grade: 'A' as const, slaComplianceRate: 99.3, dlqBacklog: 0, circuitBreakersOpen: 0, providersHealthy: 2, providersTotal: 2, lastHealthCheckAt: new Date().toISOString() }
    },
    async listOrgIds() { return [ORG_ID] },
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // eslint-disable-next-line no-console -- CLI script
  console.log('Nzila OS — Golden Demo Path')
  // eslint-disable-next-line no-console -- CLI script
  console.log('Jurisdiction: Canada (PIPEDA + Québec Law 25)')

  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Step 1: Org context
  step(1, 'Create org context')
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Org ID: ${ORG_ID}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  User:   ${DEMO_USER}`)

  // Step 2: Collect procurement pack (runs all real collectors)
  step(2, 'Collect procurement pack (real collector chain)')
  const portDeps = createDemoPortDeps()
  const ports = createRealPorts(portDeps)
  let pack = await collectProcurementPack(ORG_ID, DEMO_USER, ports)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Pack ID:    ${pack.packId}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Sections:   ${pack.manifest.sectionCount}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Artifacts:  ${pack.manifest.artifactCount}`)

  // Step 3: Sign the pack
  step(3, 'Sign procurement pack (Ed25519)')
  pack = await signProcurementPack(pack, ports)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Algorithm:  ${pack.signature?.algorithm}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Key ID:     ${pack.signature?.keyId}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Status:     ${pack.status}`)

  // Step 4: Export as signed ZIP
  step(4, 'Export signed ZIP bundle')
  const zipResult = exportAsSignedZip(pack, ORG_ID)
  const zipPath = join(OUTPUT_DIR, zipResult.filename)
  writeFileSync(zipPath, Buffer.from(zipResult.zipBuffer))
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  ZIP file:   ${zipPath}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Size:       ${zipResult.zipBuffer.byteLength} bytes`)

  // Also export JSON
  const jsonResult = exportAsJson(pack)
  const jsonPath = join(OUTPUT_DIR, jsonResult.filename)
  writeFileSync(jsonPath, jsonResult.data, 'utf-8')
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  JSON file:  ${jsonPath}`)

  // Step 5: Generate RFP response
  step(5, 'Generate RFP response (Canada / PIPEDA + Québec Law 25)')
  const assurancePorts = createDemoAssurancePorts()
  const dashboard = await computeAssuranceDashboard(ORG_ID, assurancePorts)
  const rfpResponse = generateRfpResponse({
    orgId: ORG_ID,
    generatedBy: DEMO_USER,
    procurementPack: pack,
    assuranceDashboard: dashboard,
  })
  const markdown = renderRfpMarkdown(rfpResponse)
  const rfpPath = join(OUTPUT_DIR, 'rfp-answers.md')
  writeFileSync(rfpPath, markdown, 'utf-8')
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Sections:   ${rfpResponse.sections.length}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Questions:  ${rfpResponse.totalAnswered}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  RFP file:   ${rfpPath}`)

  // Step 6: Verification summary
  step(6, 'Verification summary')
  const { keyId, publicKey } = getSigningKeyPair()
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Public Key ID:    ${keyId}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Public Key (b64): ${Buffer.from(publicKey).toString('base64').slice(0, 32)}...`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Manifest hash:    ${createHash('sha256').update(JSON.stringify(pack.manifest)).digest('hex').slice(0, 32)}...`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Pack signed:      ${pack.status === 'signed' ? 'YES' : 'NO'}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Evidence sealed:  YES (demo data pre-seeded)`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  Chain verified:   YES (single-entry chain)`)

  // eslint-disable-next-line no-console -- CLI script
  console.log('\n' + '='.repeat(62))
  // eslint-disable-next-line no-console -- CLI script
  console.log('  Golden Demo Complete')
  // eslint-disable-next-line no-console -- CLI script
  console.log('='.repeat(62))
  // eslint-disable-next-line no-console -- CLI script
  console.log(`\nOutputs:`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  ZIP:  ${zipPath}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  JSON: ${jsonPath}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log(`  RFP:  ${rfpPath}`)
  // eslint-disable-next-line no-console -- CLI script
  console.log('')
}

main().catch((err) => {
  // eslint-disable-next-line no-console -- CLI script
  console.error('Golden demo failed:', err)
  process.exit(1)
})
