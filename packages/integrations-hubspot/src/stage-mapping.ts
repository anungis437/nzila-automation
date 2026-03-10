/* ── HubSpot Deal Stage Mapping ────────────────────────────
 *
 * Bidirectional mapping between HubSpot deal stages
 * and NzilaOS case lifecycle states.
 *
 * @module @nzila/integrations-hubspot/stage-mapping
 */

import type { CaseStatus } from '@nzila/mobility-core'

/* ── HubSpot Deal Stages (Mobility Pipeline) ──────────────── */

export const HUBSPOT_STAGE_TO_CASE_STATUS: Record<string, CaseStatus> = {
  'qualifiedtobuy': 'intake',
  'presentationscheduled': 'intake',
  'decisionmakerboughtin': 'kyc_pending',
  'contractsent': 'document_verification',
  'closedwon': 'submitted',
  'closedlost': 'rejected',
}

export const CASE_STATUS_TO_HUBSPOT_STAGE: Partial<Record<CaseStatus, string>> = {
  draft: 'qualifiedtobuy',
  intake: 'presentationscheduled',
  kyc_pending: 'decisionmakerboughtin',
  aml_screening: 'decisionmakerboughtin',
  document_verification: 'contractsent',
  compliance_review: 'contractsent',
  approved: 'closedwon',
  submitted: 'closedwon',
  granted: 'closedwon',
  rejected: 'closedlost',
  withdrawn: 'closedlost',
}

/* ── Sync Log Entry ───────────────────────────────────────── */

export interface SyncLogEntry {
  timestamp: Date
  direction: 'hubspot_to_nzila' | 'nzila_to_hubspot'
  entityType: 'contact' | 'deal'
  externalId: string
  internalId: string | null
  action: 'created' | 'updated' | 'skipped' | 'failed'
  details: string
}

/**
 * Map a HubSpot deal stage to the corresponding NzilaOS case status.
 */
export function mapHubspotStageToCaseStatus(hubspotStage: string): CaseStatus | null {
  return HUBSPOT_STAGE_TO_CASE_STATUS[hubspotStage] ?? null
}

/**
 * Map a NzilaOS case status to the recommended HubSpot deal stage.
 */
export function mapCaseStatusToHubspotStage(caseStatus: CaseStatus): string | null {
  return CASE_STATUS_TO_HUBSPOT_STAGE[caseStatus] ?? null
}
