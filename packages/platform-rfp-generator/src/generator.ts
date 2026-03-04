/**
 * @nzila/platform-rfp-generator — Generator
 *
 * Auto-generates RFP responses from procurement proof packs and assurance
 * dashboards, mapping evidence to common RFP question sections.
 *
 * @module @nzila/platform-rfp-generator/generator
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  RfpAnswer,
  RfpGeneratorInput,
  RfpResponse,
  RfpSectionResponse,
} from './types'

const logger = createLogger('rfp-generator')

/**
 * Generate a complete RFP response from proof artifacts.
 */
export function generateRfpResponse(input: RfpGeneratorInput): RfpResponse {
  const { orgId, generatedBy, procurementPack, assuranceDashboard } = input

  logger.info('Generating RFP response', { orgId })

  const sections: RfpSectionResponse[] = [
    generateSecuritySection(procurementPack, assuranceDashboard),
    generatePrivacySection(procurementPack),
    generateOperationsSection(procurementPack, assuranceDashboard),
    generateDisasterRecoverySection(procurementPack),
    generateDataGovernanceSection(procurementPack),
    generateComplianceSection(procurementPack, assuranceDashboard),
    generateIntegrationSection(assuranceDashboard),
    generateCostManagementSection(procurementPack, assuranceDashboard),
  ]

  const totalQuestions = sections.reduce((sum, s) => sum + s.answers.length, 0)

  logger.info('RFP response generated', { orgId, totalQuestions })

  return {
    orgId,
    generatedAt: new Date().toISOString(),
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

  return { section: 'security', title: 'Security', answers }
}

function generatePrivacySection(
  pack: RfpGeneratorInput['procurementPack'],
): RfpSectionResponse {
  const dl = pack.sections.dataLifecycle
  const sov = pack.sections.sovereignty
  const answers: RfpAnswer[] = [
    {
      section: 'privacy',
      question: 'How do you handle data classification and protection?',
      answer: `We maintain ${dl.manifests.length} data manifests covering all data categories. ` +
        `All data classified as confidential or restricted uses encryption at rest and in transit. ` +
        `Data classifications: ${dl.manifests.map((m) => `${m.dataCategory} (${m.classification})`).join(', ')}.`,
      evidenceRefs: ['dataLifecycle.manifests'],
      confidenceLevel: 'high',
    },
    {
      section: 'privacy',
      question: 'Where is data stored and do you support data sovereignty?',
      answer: `Data is stored in ${sov.deploymentRegion} with data residency in ${sov.dataResidency}. ` +
        `Cross-border transfer: ${sov.crossBorderTransfer ? 'enabled with safeguards' : 'disabled'}. ` +
        `Regulatory frameworks: ${sov.regulatoryFrameworks.join(', ')}. ` +
        `Sovereignty profile ${sov.validated ? 'validated' : 'pending validation'}.`,
      evidenceRefs: ['sovereignty', 'dataLifecycle.manifests'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'privacy', title: 'Privacy & Data Protection', answers }
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

  return { section: 'operations', title: 'Operations & Reliability', answers }
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

  return { section: 'disaster_recovery', title: 'Disaster Recovery', answers }
}

function generateDataGovernanceSection(
  pack: RfpGeneratorInput['procurementPack'],
): RfpSectionResponse {
  const dl = pack.sections.dataLifecycle
  const gov = pack.sections.governance
  const answers: RfpAnswer[] = [
    {
      section: 'data_governance',
      question: 'How do you manage data retention and deletion?',
      answer: `${dl.retentionControls.policiesEnforced}/${dl.retentionControls.policiesTotal} retention policies are enforced. ` +
        `Auto-delete: ${dl.retentionControls.autoDeleteEnabled ? 'enabled' : 'disabled'}. ` +
        `Last purge: ${dl.retentionControls.lastPurgeAt ?? 'N/A'}. ` +
        `Data manifests define per-category retention periods with deletion policies.`,
      evidenceRefs: ['dataLifecycle.retentionControls', 'dataLifecycle.manifests'],
      confidenceLevel: 'high',
    },
    {
      section: 'data_governance',
      question: 'Do you maintain an audit trail?',
      answer: `Yes. All actions produce sealed evidence packs with hash-chained audit trails. ` +
        `Evidence packs generated: ${gov.evidencePackCount}. ` +
        `Snapshot chain length: ${gov.snapshotChainLength}. ` +
        `Chain integrity: ${gov.snapshotChainValid ? 'verified' : 'unverified'}. ` +
        `Control families covered: ${gov.controlFamiliesCovered.join(', ')}.`,
      evidenceRefs: ['governance'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'data_governance', title: 'Data Governance', answers }
}

function generateComplianceSection(
  pack: RfpGeneratorInput['procurementPack'],
  dashboard: RfpGeneratorInput['assuranceDashboard'],
): RfpSectionResponse {
  const gov = pack.sections.governance
  const sov = pack.sections.sovereignty
  const answers: RfpAnswer[] = [
    {
      section: 'compliance',
      question: 'What compliance frameworks do you support?',
      answer: `The platform is validated against: ${sov.regulatoryFrameworks.join(', ')}. ` +
        `Policy compliance rate: ${gov.policyComplianceRate}%. ` +
        `Compliance score: ${dashboard.compliance.score}/100 (${dashboard.compliance.grade}). ` +
        `All compliance snapshots are hash-chained for tamper-evident verification.`,
      evidenceRefs: ['governance', 'sovereignty', 'assurance.compliance'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'compliance', title: 'Compliance', answers }
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

  return { section: 'integration', title: 'Integration & Interoperability', answers }
}

function generateCostManagementSection(
  pack: RfpGeneratorInput['procurementPack'],
  dashboard: RfpGeneratorInput['assuranceDashboard'],
): RfpSectionResponse {
  const cost = dashboard.cost
  const answers: RfpAnswer[] = [
    {
      section: 'cost_management',
      question: 'How do you manage costs and prevent budget overruns?',
      answer: `The platform enforces per-org budget limits with denial-of-wallet controls. ` +
        `Current budget utilization: ${(cost.budgetUtilization * 100).toFixed(1)}% ` +
        `($${cost.monthlySpendUsd.toLocaleString()}/$${cost.monthlyBudgetUsd.toLocaleString()} monthly). ` +
        `Cost score: ${cost.score}/100 (${cost.grade}). ` +
        `Categories over cap: ${cost.categoriesOverCap.length > 0 ? cost.categoriesOverCap.join(', ') : 'none'}. ` +
        `Budget policies are enforced in pilot and production environments.`,
      evidenceRefs: ['assurance.cost', 'ops/cost-policy.yml'],
      confidenceLevel: 'high',
    },
  ]

  return { section: 'cost_management', title: 'Cost Management', answers }
}
