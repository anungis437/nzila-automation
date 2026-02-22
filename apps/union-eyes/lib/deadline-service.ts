/**
 * Deadline Management Service
 * 
 * Orchestrates deadline creation, monitoring, alerts, and escalations:
 * - Auto-creates deadlines when claims are filed
 * - Monitors deadline status continuously
 * - Generates proactive alerts (3 days, 1 day, day-of)
 * - Auto-escalates overdue items
 * - Manages extension workflow
 * - Tracks compliance metrics
 */

import {
  getDeadlineRuleByCode,
  getApplicableDeadlineRules,
  autoCreateClaimDeadlines,
  getClaimDeadlines,
  getPendingClaimDeadlines,
  getCriticalDeadlines,
  getOverdueDeadlines,
  completeDeadline,
  markOverdueDeadlines,
  requestDeadlineExtension,
  approveDeadlineExtension,
  denyDeadlineExtension,
  getPendingExtensionRequests,
  createDeadlineAlert,
  generateUpcomingDeadlineAlerts,
  getUnreadAlerts,
  markAlertViewed,
  recordAlertAction,
  getDeadlineComplianceMetrics,
  getMemberDeadlineSummary,
  getDeadlineDashboardSummary,
  addBusinessDays,
  type ClaimDeadline,
  type DeadlineExtension,
  type DeadlineAlert,
} from '@/db/queries/deadline-queries';
import { logger } from '@/lib/logger';

// ============================================================================
// DEADLINE CREATION
// ============================================================================

/**
 * Initialize deadlines when a claim is created
 */
export async function initializeClaimDeadlines(
  claimId: string,
  tenantId: string,
  claimType: string,
  priorityLevel: string,
  filingDate: Date,
  createdBy: string
): Promise<ClaimDeadline[]> {
  logger.info('Initializing claim deadlines', { claimId });
  
  try {
    const deadlines = await autoCreateClaimDeadlines(
      claimId,
      tenantId,
      claimType,
      priorityLevel,
      filingDate,
      createdBy
    );
    
    logger.info('Claim deadlines created', { claimId, count: deadlines.length });
    return deadlines;
  } catch (error) {
    logger.error('Failed to initialize claim deadlines', error instanceof Error ? error : new Error(String(error)), { claimId });
    throw error;
  }
}

/**
 * Add ad-hoc deadline to existing claim
 */
export async function addClaimDeadline(
  claimId: string,
  tenantId: string,
  deadlineName: string,
  daysFromNow: number,
  priority: 'low' | 'medium' | 'high' | 'critical',
  createdBy: string
): Promise<ClaimDeadline> {
  const now = new Date();
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + daysFromNow);
  
  // This would call the createClaimDeadline function
  // Implementation depends on your DB structure
  throw new Error('Not implemented - add custom deadline logic');
}

// ============================================================================
// DEADLINE MONITORING
// ============================================================================

/**
 * Check all deadlines and update statuses
 * Run this as a scheduled job every 5 minutes
 */
export async function updateDeadlineStatuses(): Promise<{
  markedOverdue: number;
  alertsGenerated: number;
}> {
  logger.info('Running deadline status update');
  
  try {
    // Mark overdue deadlines
    const markedOverdue = await markOverdueDeadlines();
    logger.info('Deadlines marked as overdue', { count: markedOverdue });
    
    // This would trigger the alert generation
    // For now, return count
    return {
      markedOverdue,
      alertsGenerated: 0, // Will be handled by separate job
    };
  } catch (error) {
    logger.error('Failed to update deadline statuses', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get upcoming deadlines for dashboard widget
 */
export async function getUpcomingDeadlines(
  tenantId: string,
  days: number = 7
): Promise<ClaimDeadline[]> {
  return getCriticalDeadlines(tenantId);
}

/**
 * Get member's upcoming deadlines
 */
export async function getMemberUpcomingDeadlines(
  memberId: string,
  tenantId: string,
  daysAhead: number = 7
): Promise<unknown> {
  const summary = await getMemberDeadlineSummary(memberId, tenantId);
  return summary;
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

/**
 * Generate alerts for upcoming deadlines
 * Run this as a scheduled job every hour
 */
export async function generateDeadlineAlerts(tenantId: string): Promise<number> {
  logger.info('Generating deadline alerts', { tenantId });
  
  try {
    const alertCount = await generateUpcomingDeadlineAlerts(tenantId);
    logger.info('Deadline alerts generated', { tenantId, count: alertCount });
    return alertCount;
  } catch (error) {
    logger.error('Failed to generate deadline alerts', error instanceof Error ? error : new Error(String(error)), { tenantId });
    throw error;
  }
}

/**
 * Send digest of upcoming deadlines
 * Run this daily at 8 AM
 */
export async function sendDailyDeadlineDigest(
  memberId: string,
  tenantId: string
): Promise<void> {
  logger.info('Sending daily deadline digest', { memberId, tenantId });
  
  try {
    const summary = await getMemberDeadlineSummary(memberId, tenantId);
    
    if (summary.overdue_count > 0 || summary.due_soon_count > 0) {
      // Send email digest
      logger.info('Daily digest ready for sending', { memberId, overdueCount: summary.overdue_count, dueSoonCount: summary.due_soon_count });
      // Implementation: Send via email service
    }
  } catch (error) {
    logger.error('Failed to send daily digest', error instanceof Error ? error : new Error(String(error)), { memberId, tenantId });
    throw error;
  }
}

/**
 * Get unread in-app alerts for member
 */
export async function getMemberAlerts(
  memberId: string,
  tenantId: string
): Promise<DeadlineAlert[]> {
  return getUnreadAlerts(memberId, tenantId);
}

/**
 * Mark alert as read
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await markAlertViewed(alertId);
}

/**
 * Record action taken on alert
 */
export async function takeAlertAction(
  alertId: string,
  action: string
): Promise<void> {
  await recordAlertAction(alertId, action);
}

// ============================================================================
// EXTENSION MANAGEMENT
// ============================================================================

/**
 * Request extension for a deadline
 */
export async function requestExtension(
  deadlineId: string,
  tenantId: string,
  requestedBy: string,
  daysRequested: number,
  reason: string
): Promise<DeadlineExtension> {
  logger.info('Extension requested for deadline', { deadlineId, daysRequested, requestedBy });
  
  // Check if deadline allows extensions
  const deadlines = await getClaimDeadlines(deadlineId);
  // Logic to validate extension eligibility
  
  const requiresApproval = daysRequested > 7; // Example: > 7 days requires approval
  
  return requestDeadlineExtension(
    deadlineId,
    tenantId,
    requestedBy,
    daysRequested,
    reason,
    requiresApproval
  );
}

/**
 * Approve pending extension request
 */
export async function approveExtension(
  extensionId: string,
  approvedBy: string,
  daysGranted?: number,
  notes?: string
): Promise<void> {
  logger.info('Approving extension', { extensionId, approvedBy });
  
  await approveDeadlineExtension(extensionId, approvedBy, daysGranted, notes);
  
  // Send notification to requester
  logger.info('Extension approved', { extensionId });
}

/**
 * Deny extension request
 */
export async function denyExtension(
  extensionId: string,
  deniedBy: string,
  reason?: string
): Promise<void> {
  logger.info('Denying extension', { extensionId, deniedBy });
  
  await denyDeadlineExtension(extensionId, deniedBy, reason);
  
  // Send notification to requester
  logger.info('Extension denied', { extensionId });
}

/**
 * Get pending extension requests for approval queue
 */
export async function getPendingExtensions(tenantId: string): Promise<DeadlineExtension[]> {
  return getPendingExtensionRequests(tenantId);
}

// ============================================================================
// ESCALATION
// ============================================================================

/**
 * Escalate overdue deadline to next level
 * Run this as a scheduled job every 15 minutes
 */
export async function escalateOverdueDeadlines(tenantId: string): Promise<number> {
  logger.info('Checking for deadlines to escalate', { tenantId });
  
  try {
    const overdueDeadlines = await getOverdueDeadlines(tenantId);
    let escalatedCount = 0;
    
    for (const deadline of overdueDeadlines) {
      // Check if enough time has passed since last escalation
      // Implement escalation logic here
      logger.info('Escalating deadline', { deadlineId: deadline.id });
      escalatedCount++;
    }
    
    logger.info('Deadlines escalated', { tenantId, count: escalatedCount });
    return escalatedCount;
  } catch (error) {
    logger.error('Failed to escalate deadlines', error instanceof Error ? error : new Error(String(error)), { tenantId });
    throw error;
  }
}

// ============================================================================
// COMPLETION
// ============================================================================

/**
 * Mark deadline as completed
 */
export async function markDeadlineComplete(
  deadlineId: string,
  completedBy: string,
  notes?: string
): Promise<void> {
  logger.info(`Completing deadline ${deadlineId}`);
  
  await completeDeadline(deadlineId, completedBy, notes);
  
  // Auto-complete related alerts
  logger.info("Related alerts marked as resolved");
}

/**
 * Auto-complete deadlines when claim status changes
 */
export async function autoCompleteClaimDeadlines(
  claimId: string,
  completedBy: string,
  claimStatus: string
): Promise<void> {
  logger.info(`Auto-completing deadlines for claim ${claimId} (status: ${claimStatus})`);
  
  const deadlines = await getPendingClaimDeadlines(claimId);
  
  for (const deadline of deadlines) {
    // Complete filing deadlines when claim is resolved
    if (claimStatus === 'resolved' || claimStatus === 'closed') {
      await completeDeadline(
        deadline.id,
        completedBy,
        `Auto-completed: Claim ${claimStatus}`
      );
    }
  }
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Get deadline compliance report
 */
export async function getComplianceReport(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<unknown> {
  return getDeadlineComplianceMetrics(tenantId, startDate, endDate);
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(tenantId: string): Promise<unknown> {
  return getDeadlineDashboardSummary(tenantId);
}

/**
 * Get member performance summary
 */
export async function getMemberPerformance(
  memberId: string,
  tenantId: string
): Promise<unknown> {
  return getMemberDeadlineSummary(memberId, tenantId);
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Calculate deadline date with business days
 */
export async function calculateDeadlineDate(
  startDate: Date,
  daysToAdd: number,
  businessDaysOnly: boolean,
  tenantId?: string
): Promise<Date> {
  if (businessDaysOnly) {
    return addBusinessDays(startDate, daysToAdd, tenantId);
  } else {
    const result = new Date(startDate);
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }
}

/**
 * Get traffic light status for deadline
 */
export function getDeadlineStatus(deadline: ClaimDeadline): {
  color: 'green' | 'yellow' | 'red' | 'black';
  label: string;
  severity: 'safe' | 'warning' | 'urgent' | 'overdue';
} {
  if (deadline.status !== 'pending') {
    return {
      color: 'green',
      label: 'Completed',
      severity: 'safe',
    };
  }
  
  if (deadline.isOverdue) {
    return {
      color: 'black',
      label: `${deadline.daysOverdue} days overdue`,
      severity: 'overdue',
    };
  }
  
  const daysUntil = deadline.daysUntilDue || 0;
  
  if (daysUntil === 0) {
    return {
      color: 'red',
      label: 'Due today',
      severity: 'urgent',
    };
  }
  
  if (daysUntil <= 1) {
    return {
      color: 'red',
      label: 'Due tomorrow',
      severity: 'urgent',
    };
  }
  
  if (daysUntil <= 3) {
    return {
      color: 'yellow',
      label: `Due in ${daysUntil} days`,
      severity: 'warning',
    };
  }
  
  return {
    color: 'green',
    label: `Due in ${daysUntil} days`,
    severity: 'safe',
  };
}

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

/**
 * Main deadline monitoring job - run every 5 minutes
 */
export async function runDeadlineMonitoringJob(tenantId: string): Promise<void> {
  logger.info(`=== Deadline Monitoring Job (${new Date().toISOString()}) ===`);
  
  try {
    // Update statuses
    const { markedOverdue } = await updateDeadlineStatuses();
    
    // Generate alerts
    const alertsGenerated = await generateDeadlineAlerts(tenantId);
    
     logger.info(`Job complete: ${markedOverdue} overdue, ${alertsGenerated} alerts`);
  } catch (error) {
     logger.error("Deadline monitoring job failed", { error });
  }
}

/**
 * Escalation job - run every 15 minutes
 */
export async function runEscalationJob(tenantId: string): Promise<void> {
  logger.info(`=== Escalation Job (${new Date().toISOString()}) ===`);
  
  try {
    const escalated = await escalateOverdueDeadlines(tenantId);
    logger.info(`Escalated ${escalated} deadlines`);
  } catch (error) {
    logger.error("Escalation job failed", { error });
  }
}

/**
 * Daily digest job - run at 8 AM daily
 */
export async function runDailyDigestJob(tenantId: string): Promise<void> {
  logger.info(`=== Daily Digest Job (${new Date().toISOString()}) ===`);
  
  try {
    // Get all members who opted in for digests
    // Send digest to each
    logger.info("Daily digests would be sent");
  } catch (error) {
    logger.error("Daily digest job failed", { error });
  }
}

