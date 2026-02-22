/**
 * SLA (Service Level Agreement) Calculator
 * PR-5: Opinionated Workflow Rules
 * 
 * Purpose: Calculate SLA compliance for union grievance cases.
 * Ensures union officers meet response time standards and provides early warning of breaches.
 * 
 * SLA Standards (based on typical union best practices):
 * - Acknowledge receipt: 2 business days from submission
 * - First substantive response: 5 business days from acknowledgment
 * - Investigation completion: 15 business days from acknowledgment
 */

import { differenceInBusinessDays, isBefore, addBusinessDays } from 'date-fns';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * SLA standards (in business days)
 */
export const SLA_STANDARDS = {
  ACKNOWLEDGE_RECEIPT: 2,
  FIRST_RESPONSE: 5,
  INVESTIGATION_COMPLETE: 15,
  BREACH_WARNING_THRESHOLD: 0.8, // Warn when 80% of time elapsed
} as const;

/**
 * SLA status for a case
 */
export type SlaStatus = 'within_sla' | 'at_risk' | 'breached';

/**
 * SLA check result
 */
export interface SlaCheckResult {
  status: SlaStatus;
  daysElapsed: number;
  daysAllowed: number;
  daysRemaining: number;
  breachDate: Date | null;
  description: string;
}

/**
 * Complete SLA assessment for a case
 */
export interface CaseSlaAssessment {
  caseId: string;
  acknowledgment: SlaCheckResult;
  firstResponse?: SlaCheckResult;
  investigation?: SlaCheckResult;
  overallStatus: SlaStatus;
  criticalSlas: string[]; // List of SLAs that are breached or at risk
}

/**
 * Timeline event (simplified from case-timeline-service)
 */
export interface TimelineEvent {
  timestamp: Date;
  type: 'submitted' | 'acknowledged' | 'first_response' | 'investigation_complete' | 'other';
}

// ============================================================================
// SLA CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate SLA status for acknowledgment requirement
 * 
 * @param submittedAt - When the case was submitted
 * @param acknowledgedAt - When the case was acknowledged (null if not yet acknowledged)
 * @param currentDate - Current date (for calculating remaining time)
 * @returns SLA check result
 * 
 * @example
 * ```typescript
 * const result = calculateAcknowledgmentSla(
 *   new Date('2026-01-13'),
 *   null,
 *   new Date('2026-01-15')
 * );
 * // result.status = 'breached' (2 business days elapsed, no acknowledgment)
 * ```
 */
export function calculateAcknowledgmentSla(
  submittedAt: Date,
  acknowledgedAt: Date | null,
  currentDate: Date = new Date()
): SlaCheckResult {
  const daysAllowed = SLA_STANDARDS.ACKNOWLEDGE_RECEIPT;
  const breachDate = addBusinessDays(submittedAt, daysAllowed);

  if (acknowledgedAt) {
    // Case was acknowledged - check if within SLA
    const daysElapsed = differenceInBusinessDays(acknowledgedAt, submittedAt);
    const daysRemaining = daysAllowed - daysElapsed;

    return {
      status: daysElapsed <= daysAllowed ? 'within_sla' : 'breached',
      daysElapsed,
      daysAllowed,
      daysRemaining,
      breachDate: daysElapsed > daysAllowed ? breachDate : null,
      description:
        daysElapsed <= daysAllowed
          ? `Acknowledged within ${daysElapsed} business days (SLA: ${daysAllowed} days)`
          : `Acknowledged after ${daysElapsed} business days (SLA breach: ${daysAllowed} days)`,
    };
  } else {
    // Case not yet acknowledged - check current status
    const daysElapsed = differenceInBusinessDays(currentDate, submittedAt);
    const daysRemaining = daysAllowed - daysElapsed;
    const percentElapsed = daysElapsed / daysAllowed;

    let status: SlaStatus;
    if (daysElapsed > daysAllowed) {
      status = 'breached';
    } else if (percentElapsed >= SLA_STANDARDS.BREACH_WARNING_THRESHOLD) {
      status = 'at_risk';
    } else {
      status = 'within_sla';
    }

    return {
      status,
      daysElapsed,
      daysAllowed,
      daysRemaining,
      breachDate: isBefore(currentDate, breachDate) ? breachDate : null,
      description:
        status === 'breached'
          ? `Acknowledgment overdue by ${Math.abs(daysRemaining)} business days`
          : status === 'at_risk'
          ? `Acknowledgment due soon (${daysRemaining} business days remaining)`
          : `Within acknowledgment SLA (${daysRemaining} days remaining)`,
    };
  }
}

/**
 * Calculate SLA status for first substantive response
 * 
 * @param acknowledgedAt - When the case was acknowledged
 * @param firstResponseAt - When first response was provided
 * @param currentDate - Current date
 * @returns SLA check result
 */
export function calculateFirstResponseSla(
  acknowledgedAt: Date,
  firstResponseAt: Date | null,
  currentDate: Date = new Date()
): SlaCheckResult {
  const daysAllowed = SLA_STANDARDS.FIRST_RESPONSE;
  const breachDate = addBusinessDays(acknowledgedAt, daysAllowed);

  if (firstResponseAt) {
    const daysElapsed = differenceInBusinessDays(firstResponseAt, acknowledgedAt);
    const daysRemaining = daysAllowed - daysElapsed;

    return {
      status: daysElapsed <= daysAllowed ? 'within_sla' : 'breached',
      daysElapsed,
      daysAllowed,
      daysRemaining,
      breachDate: daysElapsed > daysAllowed ? breachDate : null,
      description:
        daysElapsed <= daysAllowed
          ? `First response within ${daysElapsed} business days (SLA: ${daysAllowed} days)`
          : `First response after ${daysElapsed} business days (SLA breach: ${daysAllowed} days)`,
    };
  } else {
    const daysElapsed = differenceInBusinessDays(currentDate, acknowledgedAt);
    const daysRemaining = daysAllowed - daysElapsed;
    const percentElapsed = daysElapsed / daysAllowed;

    let status: SlaStatus;
    if (daysElapsed > daysAllowed) {
      status = 'breached';
    } else if (percentElapsed >= SLA_STANDARDS.BREACH_WARNING_THRESHOLD) {
      status = 'at_risk';
    } else {
      status = 'within_sla';
    }

    return {
      status,
      daysElapsed,
      daysAllowed,
      daysRemaining,
      breachDate: isBefore(currentDate, breachDate) ? breachDate : null,
      description:
        status === 'breached'
          ? `First response overdue by ${Math.abs(daysRemaining)} business days`
          : status === 'at_risk'
          ? `First response due soon (${daysRemaining} business days remaining)`
          : `Within first response SLA (${daysRemaining} days remaining)`,
    };
  }
}

/**
 * Calculate SLA status for investigation completion
 * 
 * @param acknowledgedAt - When the case was acknowledged
 * @param investigationCompleteAt - When investigation was completed
 * @param currentDate - Current date
 * @returns SLA check result
 */
export function calculateInvestigationSla(
  acknowledgedAt: Date,
  investigationCompleteAt: Date | null,
  currentDate: Date = new Date()
): SlaCheckResult {
  const daysAllowed = SLA_STANDARDS.INVESTIGATION_COMPLETE;
  const breachDate = addBusinessDays(acknowledgedAt, daysAllowed);

  if (investigationCompleteAt) {
    const daysElapsed = differenceInBusinessDays(investigationCompleteAt, acknowledgedAt);
    const daysRemaining = daysAllowed - daysElapsed;

    return {
      status: daysElapsed <= daysAllowed ? 'within_sla' : 'breached',
      daysElapsed,
      daysAllowed,
      daysRemaining,
      breachDate: daysElapsed > daysAllowed ? breachDate : null,
      description:
        daysElapsed <= daysAllowed
          ? `Investigation completed within ${daysElapsed} business days (SLA: ${daysAllowed} days)`
          : `Investigation completed after ${daysElapsed} business days (SLA breach: ${daysAllowed} days)`,
    };
  } else {
    const daysElapsed = differenceInBusinessDays(currentDate, acknowledgedAt);
    const daysRemaining = daysAllowed - daysElapsed;
    const percentElapsed = daysElapsed / daysAllowed;

    let status: SlaStatus;
    if (daysElapsed > daysAllowed) {
      status = 'breached';
    } else if (percentElapsed >= SLA_STANDARDS.BREACH_WARNING_THRESHOLD) {
      status = 'at_risk';
    } else {
      status = 'within_sla';
    }

    return {
      status,
      daysElapsed,
      daysAllowed,
      daysRemaining,
      breachDate: isBefore(currentDate, breachDate) ? breachDate : null,
      description:
        status === 'breached'
          ? `Investigation overdue by ${Math.abs(daysRemaining)} business days`
          : status === 'at_risk'
          ? `Investigation due soon (${daysRemaining} business days remaining)`
          : `Within investigation SLA (${daysRemaining} days remaining)`,
    };
  }
}

/**
 * Calculate overall SLA assessment for a case from timeline events
 * 
 * @param caseId - Case identifier
 * @param timeline - Array of timeline events
 * @param currentDate - Current date (optional, defaults to now)
 * @returns Complete SLA assessment
 * 
 * @example
 * ```typescript
 * const assessment = calculateCaseSlaStatus('case-123', [
 *   { timestamp: new Date('2026-01-13'), type: 'submitted' },
 *   { timestamp: new Date('2026-01-14'), type: 'acknowledged' },
 * ]);
 * // assessment.acknowledgment.status = 'within_sla'
 * // assessment.firstResponse.status = 'at_risk' (no first response yet)
 * ```
 */
export function calculateCaseSlaStatus(
  caseId: string,
  timeline: TimelineEvent[],
  currentDate: Date = new Date()
): CaseSlaAssessment {
  // Extract key events from timeline
  const submittedEvent = timeline.find((e) => e.type === 'submitted');
  const acknowledgedEvent = timeline.find((e) => e.type === 'acknowledged');
  const firstResponseEvent = timeline.find((e) => e.type === 'first_response');
  const investigationCompleteEvent = timeline.find((e) => e.type === 'investigation_complete');

  if (!submittedEvent) {
    throw new Error('Timeline must include a submission event');
  }

  // Calculate acknowledgment SLA
  const acknowledgment = calculateAcknowledgmentSla(
    submittedEvent.timestamp,
    acknowledgedEvent?.timestamp || null,
    currentDate
  );

  // Calculate first response SLA (only if acknowledged)
  let firstResponse: SlaCheckResult | undefined;
  if (acknowledgedEvent) {
    firstResponse = calculateFirstResponseSla(
      acknowledgedEvent.timestamp,
      firstResponseEvent?.timestamp || null,
      currentDate
    );
  }

  // Calculate investigation SLA (only if acknowledged)
  let investigation: SlaCheckResult | undefined;
  if (acknowledgedEvent) {
    investigation = calculateInvestigationSla(
      acknowledgedEvent.timestamp,
      investigationCompleteEvent?.timestamp || null,
      currentDate
    );
  }

  // Determine overall status (worst of all SLAs)
  const allSlas = [acknowledgment, firstResponse, investigation].filter(Boolean) as SlaCheckResult[];
  const overallStatus = allSlas.some((s) => s.status === 'breached')
    ? 'breached'
    : allSlas.some((s) => s.status === 'at_risk')
    ? 'at_risk'
    : 'within_sla';

  // Collect critical SLAs (breached or at risk)
  const criticalSlas: string[] = [];
  if (acknowledgment.status !== 'within_sla') criticalSlas.push('acknowledgment');
  if (firstResponse && firstResponse.status !== 'within_sla') criticalSlas.push('first_response');
  if (investigation && investigation.status !== 'within_sla') criticalSlas.push('investigation');

  return {
    caseId,
    acknowledgment,
    firstResponse,
    investigation,
    overallStatus,
    criticalSlas,
  };
}

/**
 * Get cases at risk of SLA breach from multiple assessments
 * Useful for dashboard/reporting
 */
export function getAtRiskCases(assessments: CaseSlaAssessment[]): CaseSlaAssessment[] {
  return assessments.filter((a) => a.overallStatus === 'at_risk' || a.overallStatus === 'breached');
}

/**
 * Get cases with breached SLAs
 */
export function getBreachedCases(assessments: CaseSlaAssessment[]): CaseSlaAssessment[] {
  return assessments.filter((a) => a.overallStatus === 'breached');
}

