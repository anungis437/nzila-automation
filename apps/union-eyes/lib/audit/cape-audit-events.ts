/**
 * CAPE Feature Audit Events
 *
 * Audit event constants and helper for all CAPE-specific feature actions.
 * Extends the core audit system with domain-specific events.
 *
 * @module lib/audit/cape-audit-events
 */

import { auditLog, AuditSeverity } from '@/lib/audit-logger';

// ─── Event Constants ──────────────────────────────────────────

export const CAPE_AUDIT_EVENTS = {
  // Grievance intake
  GRIEVANCE_DRAFT_SAVED: 'grievance.draft_saved',
  GRIEVANCE_SUBMITTED: 'grievance.submitted',

  // Employer communication
  EMPLOYER_CONTACT_ADDED: 'employer.contact_added',
  EMPLOYER_CONTACT_UPDATED: 'employer.contact_updated',
  EMPLOYER_CONTACT_DELETED: 'employer.contact_deleted',
  EMPLOYER_COMMUNICATION_LOGGED: 'employer.communication_logged',
  EMPLOYER_COMMUNICATION_SENT: 'employer.communication_sent',

  // Leadership reporting
  LEADERSHIP_REPORT_VIEWED: 'leadership.report_viewed',
  LEADERSHIP_REPORT_EXPORTED: 'leadership.report_exported',

  // Pilot onboarding
  PILOT_CHECKLIST_ITEM_COMPLETED: 'pilot.checklist_item_completed',
  PILOT_CHECKLIST_COMPLETED: 'pilot.checklist_completed',
  PILOT_DEMO_DATA_SEEDED: 'pilot.demo_data_seeded',
  PILOT_DEMO_DATA_PURGED: 'pilot.demo_data_purged',
} as const;

export type CapeAuditEvent = (typeof CAPE_AUDIT_EVENTS)[keyof typeof CAPE_AUDIT_EVENTS];

// ─── Helper ───────────────────────────────────────────────────

interface CapeAuditParams {
  eventType: CapeAuditEvent;
  userId?: string;
  organizationId?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: AuditSeverity;
}

export async function emitCapeAuditEvent(params: CapeAuditParams): Promise<void> {
  await auditLog({
    eventType: params.eventType,
    severity: params.severity ?? AuditSeverity.MEDIUM,
    userId: params.userId,
    organizationId: params.organizationId,
    resource: params.resource,
    resourceId: params.resourceId,
    action: params.eventType.split('.').pop(),
    details: params.details,
    outcome: 'success',
  });
}
