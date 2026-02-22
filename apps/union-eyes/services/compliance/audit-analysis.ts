/**
 * Audit Analysis Service
 * Types and utilities for audit log analysis
 */

export interface AuditQueryParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  resource?: string;
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
  onlyFailures?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  actionTypes?: string[];
  resourceTypes?: string[];
  userIds?: string[];
  riskLevels?: string[];
  severityLevels?: string[];
  organizationIds?: string[];
}

export interface AuditStatistics {
  totalLogs: number;
  totalEvents: number;
  successRate: number;
  failureRate: number;
  uniqueUsers: number;
  peakActivityHour: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  activityByHour: Array<{ hour: number; count: number }>;
  activityByDay: Array<{ date: string; count: number }>;
  eventsByAction: Record<string, number>;
  eventsByRiskLevel: Record<string, number>;
  eventsByResource: Record<string, number>;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  type: 'unusual_activity' | 'failed_login' | 'access_pattern' | 'permission_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

export interface AnomalyDetection {
  anomalies: Anomaly[];
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface ComplianceMetrics {
  overallScore: number;
  lastAuditDate: string;
  nextAuditDue: string;
  soc2Controls: {
    accessControl: {
      score: number;
      status: 'compliant' | 'non_compliant' | 'needs_review';
      evidence: string[];
      issues: string[];
    };
    auditLogging: {
      score: number;
      status: 'compliant' | 'non_compliant' | 'needs_review';
      evidence: string[];
      issues: string[];
    };
    dataProtection: {
      score: number;
      status: 'compliant' | 'non_compliant' | 'needs_review';
      evidence: string[];
      issues: string[];
    };
    incidentResponse: {
      score: number;
      status: 'compliant' | 'non_compliant' | 'needs_review';
      evidence: string[];
      issues: string[];
    };
  };
}
