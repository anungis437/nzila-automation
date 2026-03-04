/**
 * @nzila/platform-rfp-generator — Generator
 *
 * Auto-generates RFP responses from procurement proof packs and assurance
 * dashboards, mapping evidence to common RFP question sections.
 *
 * Default jurisdiction: Canada (PIPEDA + Québec Law 25).
 *
 * @module @nzila/platform-rfp-generator/generator
 */
import { createLogger } from '@nzila/os-core/telemetry'
import { nowISO } from '@nzila/platform-utils/time'
import type {
  RfpAnswer,
  RfpGeneratorInput,
  RfpResponse,
  RfpSectionResponse,
} from './types'

const logger = createLogger('rfp-generator')

/**
 * Generate a complete RFP response from proof artifacts.
 *
 * Section order:
 *   1. Security Controls
 *   2. Privacy & Data Protection
 *   3. Evidence & Auditability
 *   4. Operational Resilience
 *   5. Integrations & Data Flow
 *   6. Hosting & Sovereignty
 *   7. Disaster Recovery
 *   8. Verification Appendix
 */
export function generateRfpResponse(input: RfpGeneratorInput): RfpResponse {
  const { orgId, generatedBy, procurementPack, assuranceDashboard } = input

  logger.info('Generating RFP response', { orgId })

  const sections: RfpSectionResponse[] = [
    generateSecuritySection(procurementPack, assuranceDashboard),
    generatePrivacySection(procurementPack),
    generateEvidenceAuditabilitySection(procurementPack, assuranceDashboard),
    generateOperationsSection(procurementPack, assuranceDashboard),
    generateIntegrationSection(assuranceDashboard),
    generateHostingSovereigntySection(procurementPack),
    generateDisasterRecoverySection(procurementPack),
    generateVerificationAppendix(procurementPack),
  ]

  const totalQuestions = sections.reduce((sum, s) => sum + s.answers.length, 0)

  logger.info('RFP response generated', { orgId, totalQuestions })

  return {
    orgId,
    generatedAt: nowISO(),
    generatedBy,
    sections,
    totalQuestions,
    totalAnswered: totalQuestions,
  }
}

/**
 * Render an RFP response as Markdown.
 */
export function renderRfpMarkdown(response: RfpResponse): string {
  const lines: string[] = [
    '# RFP Response — Nzila OS Platform',
    '',
    `> Generated: ${response.generatedAt}`,
    `> Organisation: ${response.orgId}`,
    `> Questions answered: ${response.totalAnswered}/${response.totalQuestions}`,
    '',
    '---',
    '',
  ]

  for (const section of response.sections) {
    lines.push(`## ${section.title}`)
    lines.push('')

    for (const answer of section.answers) {
      lines.push(`### ${answer.question}`)
      lines.push('')
      lines.push(answer.answer)
      lines.push('')
      if (answer.evidenceRefs.length > 0) {
        lines.push(`**Evidence:** ${answer.evidenceRefs.join(', ')}`)
        lines.push('')
        lines.push(`**Confidence:** ${answer.confidenceLevel}`)
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

// ── Section Generators ──────────────────────────────────────────────────────

function generateSecuritySection(
  pack: RfpGeneratorInput['procurementPack'],
  dashboard: RfpGeneratorInput['assuranceDashboard'],
): RfpSectionResponse {
  const sec = pack.sections.security
  const answers: RfpAnswer[] = [
    {
      section: 'security',
      question: 'What is your vulnerability management process?',
      answer: `We perform continuous dependency scanning and maintain a lockfile integrity check. ` +
        `Current posture: ${sec.dependencyAudit.criticalVulnerabilities} critical, ` +
        `${sec.dependencyAudit.highVulnerabilities} high, ` +
        `${sec.dependencyAudit.mediumVulnerabilities} medium vulnerabilities. ` +
        `Blocked license families: ${sec.dependencyAudit.blockedLicenses.length > 0 ? sec.dependencyAudit.blockedLicenses.join(', ') : 'GPL, AGPL, SSPL (enforced by policy)'}. ` +
        `Security score: ${dashboard.security.score}/100 (${dashboard.security.grade}).`,
      evidenceRefs: ['security.dependencyAudit', 'security.vulnerabilitySummary'],
      confidenceLevel: 'high',
    },
    {
      section: 'security',
      question: 'Do you provide signed security attestations?',
      answer: `Yes. All builds produce a signed attestation using ${sec.signedAttestation.algorithm}. ` +
        `Attestation scope: ${sec.signedAttestation.scope}. ` +
        `Signatures are verifiable and included in procurement evidence packs.`,
      evidenceRefs: ['security.signedAttestation'],
      confidenceLevel: 'high',
    },
    {
      section: 'security',
      question: 'What is your current security score?',
      answer: `Our platform security score is ${dashboard.security.score}/100 (grade ${dashboard.security.grade}). ` +
        `Lockfile integrity: ${sec.dependencyAudit.lockfileIntegrity ? 'verified' : 'unverified'}. ` +
        `Attestation: ${dashboard.security.attestationValid ? 'valid' : 'invalid'}.`,
      evidenceRefs: ['assurance.security'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'security', title: '1. Security Controls', answers }
}

function generatePrivacySection(
  pack: RfpGeneratorInput['procurementPack'],
): RfpSectionResponse {
  const dl = pack.sections.dataLifecycle
  const sov = pack.sections.sovereignty
  const frameworks = sov.regulatoryFrameworks.join(', ')
  const answers: RfpAnswer[] = [
    {
      section: 'privacy',
      question: 'How do you handle data classification and protection?',
      answer: `We maintain ${dl.manifests.length} data manifests covering all data categories. ` +
        `All data classified as confidential or restricted uses encryption at rest and in transit. ` +
        `Data classifications: ${dl.manifests.map((m) => `${m.dataCategory} (${m.classification})`).join(', ')}. ` +
        `Privacy controls are aligned with ${frameworks}.`,
      evidenceRefs: ['dataLifecycle.manifests'],
      confidenceLevel: 'high',
    },
    {
      section: 'privacy',
      question: 'Where is data stored and do you support data sovereignty?',
      answer: `Data is stored in ${sov.deploymentRegion} with data residency in ${sov.dataResidency}. ` +
        `Cross-border transfer: ${sov.crossBorderTransfer ? 'enabled with safeguards' : 'disabled'}. ` +
        `Regulatory frameworks: ${frameworks}. ` +
        `Sovereignty profile ${sov.validated ? 'validated' : 'pending validation'}.`,
      evidenceRefs: ['sovereignty', 'dataLifecycle.manifests'],
      confidenceLevel: 'high',
    },
    {
      section: 'privacy',
      question: 'How do you comply with PIPEDA and Québec Law 25 (Bill 64)?',
      answer: `The platform enforces data residency within ${sov.dataResidency} with no cross-border transfers ` +
        `(unless explicitly enabled with documented safeguards). All personally identifiable information is ` +
        `classified as confidential, subject to ${dl.retentionControls.policiesEnforced}/${dl.retentionControls.policiesTotal} ` +
        `retention policies with auto-delete ${dl.retentionControls.autoDeleteEnabled ? 'enabled' : 'disabled'}. ` +
        `Privacy impact assessments are part of the evidence-pack governance cycle. ` +
        `Consent management and data subject access requests are supported through platform API endpoints. ` +
        `All privacy controls are auditable via hash-chained compliance snapshots.`,
      evidenceRefs: ['sovereignty', 'dataLifecycle.retentionControls', 'governance'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'privacy', title: '2. Privacy & Data Protection', answers }
}

function generateOperationsSection(
  pack: RfpGeneratorInput['procurementPack'],
  dashboard: RfpGeneratorInput['assuranceDashboard'],
): RfpSectionResponse {
  const ops = pack.sections.operational
  const answers: RfpAnswer[] = [
    {
      section: 'operations',
      question: 'What are your SLA/SLO commitments?',
      answer: `We maintain ${ops.sloCompliance.targets.length} SLO targets with ${ops.sloCompliance.overall}% overall compliance. ` +
        `p95 latency: ${ops.performanceMetrics.p95Ms}ms. Error rate: ${ops.performanceMetrics.errorRate}%. ` +
        `Uptime: ${ops.performanceMetrics.uptimePercent}%. ` +
        `Ops confidence score: ${dashboard.ops.confidenceScore}/100.`,
      evidenceRefs: ['operational.sloCompliance', 'operational.performanceMetrics'],
      confidenceLevel: 'high',
    },
    {
      section: 'operations',
      question: 'What is your incident response track record?',
      answer: `Total incidents (trailing period): ${ops.incidentSummary.totalIncidents}. ` +
        `Resolved: ${ops.incidentSummary.resolvedIncidents}. ` +
        `Mean time to resolution: ${ops.incidentSummary.meanTimeToResolutionMinutes} minutes. ` +
        `Trend direction: ${dashboard.ops.trendDirection}.`,
      evidenceRefs: ['operational.incidentSummary', 'assurance.ops'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'operations', title: '4. Operational Resilience', answers }
}

function generateDisasterRecoverySection(
  pack: RfpGeneratorInput['procurementPack'],
): RfpSectionResponse {
  const sov = pack.sections.sovereignty
  const ops = pack.sections.operational
  const answers: RfpAnswer[] = [
    {
      section: 'disaster_recovery',
      question: 'What is your disaster recovery strategy?',
      answer: `The platform is deployed in ${sov.deploymentRegion} with documented disaster recovery ` +
        `and business continuity procedures. Recovery procedures are tested and documented in ops runbooks. ` +
        `MTTR: ${ops.incidentSummary.meanTimeToResolutionMinutes} minutes (based on incident history). ` +
        `All operational evidence is hash-chained and tamper-evident for auditability.`,
      evidenceRefs: ['sovereignty', 'operational.incidentSummary'],
      confidenceLevel: 'medium',
    },
  ]

  return { section: 'disaster_recovery', title: '7. Disaster Recovery', answers }
}

function generateEvidenceAuditabilitySection(
  pack: RfpGeneratorInput['procurementPack'],
  dashboard: RfpGeneratorInput['assuranceDashboard'],
): RfpSectionResponse {
  const dl = pack.sections.dataLifecycle
  const gov = pack.sections.governance
  const sov = pack.sections.sovereignty
  const answers: RfpAnswer[] = [
    {
      section: 'evidence_auditability',
      question: 'Do you maintain an audit trail?',
      answer: `Yes. All actions produce sealed evidence packs with hash-chained audit trails. ` +
        `Evidence packs generated: ${gov.evidencePackCount}. ` +
        `Snapshot chain length: ${gov.snapshotChainLength}. ` +
        `Chain integrity: ${gov.snapshotChainValid ? 'verified' : 'unverified'}. ` +
        `Control families covered: ${gov.controlFamiliesCovered.join(', ')}.`,
      evidenceRefs: ['governance'],
      confidenceLevel: 'high',
    },
    {
      section: 'evidence_auditability',
      question: 'How do you manage data retention and deletion?',
      answer: `${dl.retentionControls.policiesEnforced}/${dl.retentionControls.policiesTotal} retention policies are enforced. ` +
        `Auto-delete: ${dl.retentionControls.autoDeleteEnabled ? 'enabled' : 'disabled'}. ` +
        `Last purge: ${dl.retentionControls.lastPurgeAt ?? 'N/A'}. ` +
        `Data manifests define per-category retention periods with deletion policies.`,
      evidenceRefs: ['dataLifecycle.retentionControls', 'dataLifecycle.manifests'],
      confidenceLevel: 'high',
    },
    {
      section: 'evidence_auditability',
      question: 'What compliance frameworks does your platform support?',
      answer: `The platform is designed to support compliance requirements through verifiable controls and audit artifacts. ` +
        `Regulatory alignment includes ${sov.regulatoryFrameworks.join(' and ')}. ` +
        `Policy compliance rate: ${gov.policyComplianceRate}%. ` +
        `Compliance score: ${dashboard.compliance.score}/100 (${dashboard.compliance.grade}). ` +
        `All compliance snapshots are hash-chained for tamper-evident verification.`,
      evidenceRefs: ['governance', 'sovereignty', 'assurance.compliance'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'evidence_auditability', title: '3. Evidence & Auditability', answers }
}

function generateIntegrationSection(
  dashboard: RfpGeneratorInput['assuranceDashboard'],
): RfpSectionResponse {
  const integ = dashboard.integrationReliability
  const answers: RfpAnswer[] = [
    {
      section: 'integration',
      question: 'How do you ensure integration reliability?',
      answer: `Integration SLA compliance: ${integ.slaComplianceRate}%. ` +
        `Healthy providers: ${integ.providersHealthy}/${integ.providersTotal}. ` +
        `DLQ backlog: ${integ.dlqBacklog}. ` +
        `Circuit breakers open: ${integ.circuitBreakersOpen}. ` +
        `All integrations use circuit breakers, retry policies with exponential backoff, ` +
        `and dead-letter queues for resilience.`,
      evidenceRefs: ['assurance.integrationReliability'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'integration', title: '5. Integrations & Data Flow', answers }
}

function generateHostingSovereigntySection(
  pack: RfpGeneratorInput['procurementPack'],
): RfpSectionResponse {
  const sov = pack.sections.sovereignty
  const frameworks = sov.regulatoryFrameworks.join(', ')
  const answers: RfpAnswer[] = [
    {
      section: 'hosting_sovereignty',
      question: 'What hosting modes are available and where is infrastructure deployed?',
      answer: `The platform is deployed in ${sov.deploymentRegion} with data stored exclusively in ${sov.dataResidency}. ` +
        `Cross-border data transfer is ${sov.crossBorderTransfer ? 'enabled with documented safeguards and consent' : 'disabled by default'}. ` +
        `Supported sovereignty modes: single-region (default), multi-region with data-residency constraints, ` +
        `and air-gapped (on-premise) for regulated workloads. ` +
        `Regulatory alignment: ${frameworks}. ` +
        `All sovereignty configuration is captured in the procurement pack and verifiable via the signed manifest.`,
      evidenceRefs: ['sovereignty', 'procurement-pack:manifest'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'hosting_sovereignty', title: '6. Hosting & Sovereignty', answers }
}

function generateVerificationAppendix(
  pack: RfpGeneratorInput['procurementPack'],
): RfpSectionResponse {
  const sig = pack.signature
  const answers: RfpAnswer[] = [
    {
      section: 'verification',
      question: 'How can we independently verify the evidence in this procurement pack?',
      answer: `Every procurement pack is self-verifying. Verification steps:\n\n` +
        `1. **Download** the signed ZIP from the Proof Center (or via API: POST /api/proof-center/export).\n` +
        `2. **Extract** the ZIP. It contains: MANIFEST.json, procurement-pack.json, signatures.json, ` +
        `verification.json, and per-section files under sections/.\n` +
        `3. **Verify MANIFEST integrity**: for each file listed in MANIFEST.json, compute SHA-256 hash ` +
        `and compare against the recorded checksum.\n` +
        `4. **Verify Ed25519 signature**: use the public key from GET /api/proof-center/public-key ` +
        `(keyId: ${sig?.keyId ?? 'N/A'}) to verify signatures.json against the MANIFEST hash.\n` +
        `5. **Verify hash chain**: compliance snapshots reference previous hashes — walk the chain ` +
        `and confirm each entry's hash matches the SHA-256 of its canonical JSON payload.\n\n` +
        `CLI verification:\n` +
        `\`\`\`bash\n` +
        `# Extract and verify\n` +
        `unzip Procurement-Pack-*.zip -d pack/\n` +
        `# Check manifest hashes\n` +
        `sha256sum -c pack/MANIFEST.json\n` +
        `# Verify signature (requires Ed25519 public key)\n` +
        `openssl pkeyutl -verify -pubin -inkey public.pem \\\\\n` +
        `  -sigfile pack/signatures.json -in pack/MANIFEST.json\n` +
        `\`\`\`\n\n` +
        `Algorithm: ${sig?.algorithm ?? 'Ed25519'}. ` +
        `All evidence is reproducible — re-running collectors produces the same output for the same state.`,
      evidenceRefs: ['procurement-pack:manifest', 'procurement-pack:signature', 'api:/proof-center/public-key'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'verification', title: '8. Verification Appendix', answers }
}
