import type {
  AppComplianceStatus,
  ComplianceLevel,
  GovernanceFinding,
  GovernanceStatusReport,
  GovernanceStatus,
} from './types'
import { getAuditTimeline } from './auditTimeline'

export function assessAppCompliance(app: {
  name: string
  hasSbom: boolean
  hasPolicyEngine: boolean
  hasEvidencePack: boolean
  hasHealthEndpoint: boolean
  hasMetricsEndpoint: boolean
  hasTests: boolean
}): AppComplianceStatus {
  const checks = [
    app.hasSbom,
    app.hasPolicyEngine,
    app.hasEvidencePack,
    app.hasHealthEndpoint,
    app.hasMetricsEndpoint,
    app.hasTests,
  ]
  const passed = checks.filter(Boolean).length

  let complianceLevel: ComplianceLevel
  if (passed === checks.length) {
    complianceLevel = 'full'
  } else if (passed >= checks.length * 0.5) {
    complianceLevel = 'partial'
  } else {
    complianceLevel = 'non_compliant'
  }

  return {
    app: app.name,
    hasSbom: app.hasSbom,
    hasPolicyEngine: app.hasPolicyEngine,
    hasEvidencePack: app.hasEvidencePack,
    hasHealthEndpoint: app.hasHealthEndpoint,
    hasMetricsEndpoint: app.hasMetricsEndpoint,
    hasTests: app.hasTests,
    complianceLevel,
    lastChecked: new Date().toISOString(),
  }
}

export function generateFindings(
  statuses: AppComplianceStatus[],
): GovernanceFinding[] {
  const findings: GovernanceFinding[] = []

  for (const status of statuses) {
    if (!status.hasSbom) {
      findings.push({
        app: status.app,
        category: 'sbom',
        severity: 'high',
        message: `${status.app} is missing SBOM generation`,
      })
    }
    if (!status.hasPolicyEngine) {
      findings.push({
        app: status.app,
        category: 'policy',
        severity: 'critical',
        message: `${status.app} does not integrate platform-policy-engine`,
      })
    }
    if (!status.hasEvidencePack) {
      findings.push({
        app: status.app,
        category: 'evidence',
        severity: 'high',
        message: `${status.app} is missing evidence pack export endpoint`,
      })
    }
    if (!status.hasHealthEndpoint) {
      findings.push({
        app: status.app,
        category: 'health',
        severity: 'medium',
        message: `${status.app} is missing /api/health endpoint`,
      })
    }
    if (!status.hasMetricsEndpoint) {
      findings.push({
        app: status.app,
        category: 'metrics',
        severity: 'medium',
        message: `${status.app} is missing /api/metrics endpoint`,
      })
    }
    if (!status.hasTests) {
      findings.push({
        app: status.app,
        category: 'testing',
        severity: 'high',
        message: `${status.app} has no test coverage`,
      })
    }
  }

  return findings
}

export function buildGovernanceReport(
  statuses: AppComplianceStatus[],
  commitHash: string,
): GovernanceStatusReport {
  const findings = generateFindings(statuses)

  let overallCompliance: ComplianceLevel = 'full'
  if (statuses.some((s) => s.complianceLevel === 'non_compliant')) {
    overallCompliance = 'non_compliant'
  } else if (statuses.some((s) => s.complianceLevel === 'partial')) {
    overallCompliance = 'partial'
  }

  const driftDetected = findings.some(
    (f) => f.severity === 'critical' || f.severity === 'high',
  )

  return {
    timestamp: new Date().toISOString(),
    commitHash,
    overallCompliance,
    apps: statuses,
    driftDetected,
    findings,
  }
}

export function getGovernanceStatus(params: {
  policyEngineAvailable: boolean
  evidencePackValid: boolean
  sbomExists: boolean
  complianceSnapshotAge?: 'current' | 'stale' | 'missing'
}): GovernanceStatus {
  const timeline = getAuditTimeline()
  const hasRecentEvents = timeline.length > 0

  return {
    policy_engine: params.policyEngineAvailable ? 'healthy' : 'missing',
    evidence_pack: params.evidencePackValid ? 'verified' : 'missing',
    sbom_current: params.sbomExists,
    compliance_snapshot: params.complianceSnapshotAge ?? 'missing',
    audit_timeline: hasRecentEvents ? 'healthy' : 'degraded',
    generated_at: new Date().toISOString(),
  }
}
