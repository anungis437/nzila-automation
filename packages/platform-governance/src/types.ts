import { z } from 'zod'

// ── Audit Timeline ──────────────────────────────────────

export type GovernanceEventType =
  | 'policy_evaluated'
  | 'compliance_check'
  | 'evidence_exported'
  | 'approval_granted'
  | 'approval_denied'
  | 'drift_detected'
  | 'remediation_applied'

export interface AuditTimelineEntry {
  id: string
  timestamp: string
  eventType: GovernanceEventType
  actor: string
  orgId: string
  app: string
  policyResult: 'pass' | 'fail' | 'warn'
  commitHash: string
  details?: Record<string, unknown>
}

export const auditTimelineEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  eventType: z.enum([
    'policy_evaluated',
    'compliance_check',
    'evidence_exported',
    'approval_granted',
    'approval_denied',
    'drift_detected',
    'remediation_applied',
  ]),
  actor: z.string().min(1),
  orgId: z.string().min(1),
  app: z.string().min(1),
  policyResult: z.enum(['pass', 'fail', 'warn']),
  commitHash: z.string().min(1),
  details: z.record(z.unknown()).optional(),
})

// ── Governance Status ───────────────────────────────────

export type ComplianceLevel = 'full' | 'partial' | 'non_compliant'

export interface AppComplianceStatus {
  app: string
  hasSbom: boolean
  hasPolicyEngine: boolean
  hasEvidencePack: boolean
  hasHealthEndpoint: boolean
  hasMetricsEndpoint: boolean
  hasTests: boolean
  complianceLevel: ComplianceLevel
  lastChecked: string
}

export interface GovernanceStatusReport {
  timestamp: string
  commitHash: string
  overallCompliance: ComplianceLevel
  apps: AppComplianceStatus[]
  driftDetected: boolean
  findings: GovernanceFinding[]
}

export interface GovernanceFinding {
  app: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
}

export const appComplianceStatusSchema = z.object({
  app: z.string(),
  hasSbom: z.boolean(),
  hasPolicyEngine: z.boolean(),
  hasEvidencePack: z.boolean(),
  hasHealthEndpoint: z.boolean(),
  hasMetricsEndpoint: z.boolean(),
  hasTests: z.boolean(),
  complianceLevel: z.enum(['full', 'partial', 'non_compliant']),
  lastChecked: z.string().datetime(),
})

export const governanceStatusReportSchema = z.object({
  timestamp: z.string().datetime(),
  commitHash: z.string(),
  overallCompliance: z.enum(['full', 'partial', 'non_compliant']),
  apps: z.array(appComplianceStatusSchema),
  driftDetected: z.boolean(),
  findings: z.array(
    z.object({
      app: z.string(),
      category: z.string(),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      message: z.string(),
    }),
  ),
})
