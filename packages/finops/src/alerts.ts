/**
 * Budget Alert Policies
 *
 * Evaluates org spending against budget thresholds
 * and produces alerts at configurable severity levels.
 *
 * Integrates with @nzila/platform-cost for cost data
 * and ops/cost-policy.yml for org-level budget limits.
 */

import { z } from 'zod';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';

export const BudgetAlertSchema = z.object({
  id: z.string(),
  orgId: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string(),
  message: z.string(),
  currentSpend: z.number(),
  budgetLimit: z.number(),
  utilizationPercent: z.number(),
  resource: z.string(),
  period: z.string(),
  triggeredAt: z.string().datetime(),
  acknowledged: z.boolean().default(false),
});

export type BudgetAlert = z.infer<typeof BudgetAlertSchema>;

export interface BudgetThreshold {
  percent: number;
  severity: AlertSeverity;
  action: 'notify' | 'throttle' | 'block';
}

export interface OrgBudget {
  orgId: string;
  resource: string;
  limit: number;
  period: 'daily' | 'monthly';
  currentSpend: number;
}

// ── Default Thresholds ────────────────────────────────────────────────────────

/**
 * Default alert thresholds aligned with ops/cost-policy.yml.
 *
 * 50% → info (plan ahead)
 * 80% → warning (take action)
 * 95% → critical (imminent limit)
 * 100% → critical + throttle
 */
export const DEFAULT_ALERT_THRESHOLDS: BudgetThreshold[] = [
  { percent: 50, severity: 'info', action: 'notify' },
  { percent: 80, severity: 'warning', action: 'notify' },
  { percent: 95, severity: 'critical', action: 'notify' },
  { percent: 100, severity: 'critical', action: 'throttle' },
];

// ── Alert Evaluation ──────────────────────────────────────────────────────────

/**
 * Evaluate org budgets against thresholds and produce alerts.
 *
 * Returns only the *highest severity* alert per org+resource
 * to avoid alert fatigue.
 */
export function evaluateBudgetAlerts(
  budgets: OrgBudget[],
  thresholds: BudgetThreshold[] = DEFAULT_ALERT_THRESHOLDS,
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const now = new Date().toISOString();

  // Sort thresholds descending so we find highest match first
  const sortedThresholds = [...thresholds].sort((a, b) => b.percent - a.percent);

  for (const budget of budgets) {
    const utilization = (budget.currentSpend / budget.limit) * 100;

    // Find highest matching threshold
    const matchedThreshold = sortedThresholds.find((t) => utilization >= t.percent);
    if (!matchedThreshold) continue;

    const alert: BudgetAlert = {
      id: `budget-${budget.orgId}-${budget.resource}-${budget.period}-${matchedThreshold.severity}`,
      orgId: budget.orgId,
      severity: matchedThreshold.severity,
      title: `Budget ${matchedThreshold.severity}: ${budget.resource}`,
      message: buildAlertMessage(budget, matchedThreshold, utilization),
      currentSpend: budget.currentSpend,
      budgetLimit: budget.limit,
      utilizationPercent: Math.round(utilization * 100) / 100,
      resource: budget.resource,
      period: budget.period,
      triggeredAt: now,
      acknowledged: false,
    };

    alerts.push(alert);
  }

  // Sort by severity (critical first) then utilization
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      b.utilizationPercent - a.utilizationPercent,
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAlertMessage(
  budget: OrgBudget,
  threshold: BudgetThreshold,
  utilization: number,
): string {
  const base = `Org ${budget.orgId}: ${budget.resource} spending is at ${Math.round(utilization)}% of ${budget.period} budget ($${budget.currentSpend.toFixed(2)} / $${budget.limit.toFixed(2)}).`;

  switch (threshold.action) {
    case 'throttle':
      return `${base} Requests will be throttled to prevent budget overrun.`;
    case 'block':
      return `${base} Further requests are blocked until the next billing period.`;
    default:
      return base;
  }
}
