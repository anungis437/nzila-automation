/* ── Evidence Pack Integration ─────────────────────────────
 *
 * Hooks into the platform evidence-pack system to generate
 * audit-ready compliance evidence for each workflow step.
 *
 * @module @nzila/mobility-compliance/evidence
 */

import type { ComplianceEventType, SeverityLevel } from '@nzila/mobility-core'
import type { ComplianceStep, ComplianceCheckResult } from './workflows'

/* ── Types ────────────────────────────────────────────────── */

export interface EvidenceEntry {
  stepId: ComplianceStep
  eventType: ComplianceEventType
  severity: SeverityLevel
  timestamp: Date
  actorId: string
  caseId: string
  details: Record<string, unknown>
  attachments: EvidenceAttachment[]
}

export interface EvidenceAttachment {
  name: string
  mimeType: string
  url: string
}

export interface EvidencePack {
  caseId: string
  orgId: string
  generatedAt: Date
  entries: EvidenceEntry[]
  summary: EvidencePackSummary
}

export interface EvidencePackSummary {
  totalSteps: number
  completedSteps: number
  passedChecks: number
  failedChecks: number
  highestSeverity: SeverityLevel
}

/* ── Evidence Builder ─────────────────────────────────────── */

/**
 * Build an evidence entry from a compliance check result.
 */
export function buildEvidenceEntry(
  step: ComplianceStep,
  result: ComplianceCheckResult,
  caseId: string,
  actorId: string,
  attachments: EvidenceAttachment[] = [],
): EvidenceEntry {
  return {
    stepId: step,
    eventType: result.eventType,
    severity: result.severity,
    timestamp: new Date(),
    actorId,
    caseId,
    details: result.details,
    attachments,
  }
}

/**
 * Compile all evidence entries into a pack for audit/export.
 */
export function buildEvidencePack(
  caseId: string,
  orgId: string,
  entries: EvidenceEntry[],
): EvidencePack {
  const passedChecks = entries.filter((e) =>
    e.eventType.endsWith('_completed') ||
    e.eventType.endsWith('_clear') ||
    e.eventType.endsWith('_verified') ||
    e.eventType === 'compliance_approved',
  ).length

  const failedChecks = entries.filter((e) =>
    e.eventType.endsWith('_flag') ||
    e.eventType === 'compliance_rejected' ||
    e.eventType === 'risk_escalation',
  ).length

  const severityOrder: SeverityLevel[] = ['info', 'warning', 'critical']
  const highestSeverity = entries.reduce<SeverityLevel>(
    (max, e) =>
      severityOrder.indexOf(e.severity) > severityOrder.indexOf(max)
        ? e.severity
        : max,
    'info',
  )

  const uniqueSteps = new Set(entries.map((e) => e.stepId))

  return {
    caseId,
    orgId,
    generatedAt: new Date(),
    entries,
    summary: {
      totalSteps: 6,
      completedSteps: uniqueSteps.size,
      passedChecks,
      failedChecks,
      highestSeverity,
    },
  }
}
