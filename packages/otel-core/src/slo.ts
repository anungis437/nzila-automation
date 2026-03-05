/**
 * SLO Monitoring & Burn-Rate Alerting
 *
 * Implements SLO-based alerting using the multi-window, multi-burn-rate
 * approach from Google's SRE Workbook.
 */

import { z } from 'zod';

// ── Types ────────────────────────────────────────────────────────────────────

export const SLODefinitionSchema = z.object({
  name: z.string(),
  service: z.string(),
  /** Target as a decimal (0.999 = 99.9%) */
  target: z.number().min(0).max(1),
  /** What we're measuring */
  indicator: z.enum(['availability', 'latency', 'error_rate', 'throughput']),
  /** Window in hours for the SLO period */
  windowHours: z.number().positive().default(720), // 30 days
  /** Latency threshold in ms (for latency SLIs) */
  latencyThresholdMs: z.number().positive().optional(),
  /** Owner team for escalation */
  owner: z.string().default('platform-team'),
});

export type SLODefinition = z.infer<typeof SLODefinitionSchema>;

export const BurnRateAlertSchema = z.object({
  sloName: z.string(),
  service: z.string(),
  burnRate: z.number(),
  /** How fast we're consuming error budget */
  budgetConsumedPercent: z.number(),
  /** Estimated time until budget exhaustion */
  exhaustionHours: z.number().nullable(),
  severity: z.enum(['info', 'warning', 'critical', 'page']),
  windowHours: z.number(),
  timestamp: z.date(),
  traceId: z.string().optional(),
});

export type BurnRateAlert = z.infer<typeof BurnRateAlertSchema>;

// ── SLO Definitions for Nzila Services ───────────────────────────────────────

export const NZILA_SLOS: SLODefinition[] = [
  // Availability SLOs
  {
    name: 'console-availability',
    service: 'console',
    target: 0.999,
    indicator: 'availability',
    windowHours: 720,
    owner: 'platform-team',
  },
  {
    name: 'web-availability',
    service: 'web',
    target: 0.999,
    indicator: 'availability',
    windowHours: 720,
    owner: 'platform-team',
  },
  {
    name: 'orchestrator-api-availability',
    service: 'orchestrator-api',
    target: 0.9999,
    indicator: 'availability',
    windowHours: 720,
    owner: 'platform-team',
  },
  {
    name: 'union-eyes-availability',
    service: 'union-eyes',
    target: 0.999,
    indicator: 'availability',
    windowHours: 720,
    owner: 'platform-team',
  },
  // Latency SLOs
  {
    name: 'console-latency-p99',
    service: 'console',
    target: 0.99,
    indicator: 'latency',
    latencyThresholdMs: 500,
    windowHours: 720,
    owner: 'platform-team',
  },
  {
    name: 'orchestrator-api-latency-p99',
    service: 'orchestrator-api',
    target: 0.99,
    indicator: 'latency',
    latencyThresholdMs: 200,
    windowHours: 720,
    owner: 'platform-team',
  },
  {
    name: 'trade-latency-p99',
    service: 'trade',
    target: 0.99,
    indicator: 'latency',
    latencyThresholdMs: 200,
    windowHours: 720,
    owner: 'platform-team',
  },
  // Error Rate SLOs
  {
    name: 'platform-error-rate',
    service: '*',
    target: 0.999,
    indicator: 'error_rate',
    windowHours: 720,
    owner: 'platform-team',
  },
];

// ── SLO Monitor ──────────────────────────────────────────────────────────────

interface MetricWindow {
  totalRequests: number;
  goodRequests: number;
  timestamp: Date;
}

/**
 * SLO Monitor with multi-window, multi-burn-rate alerting.
 *
 * Implements the Google SRE approach:
 * - Fast burn (6h window, 14.4x burn rate) → Page
 * - Slow burn (3d window, 1x burn rate)     → Ticket
 */
export class SLOMonitor {
  private slos: Map<string, SLODefinition> = new Map();
  private windows: Map<string, MetricWindow[]> = new Map();

  constructor(slos: SLODefinition[] = NZILA_SLOS) {
    for (const slo of slos) {
      this.slos.set(slo.name, SLODefinitionSchema.parse(slo));
      this.windows.set(slo.name, []);
    }
  }

  /**
   * Record a request outcome for SLO tracking.
   */
  recordRequest(
    service: string,
    indicator: SLODefinition['indicator'],
    good: boolean,
  ): void {
    for (const [name, slo] of this.slos) {
      if (
        (slo.service === service || slo.service === '*') &&
        slo.indicator === indicator
      ) {
        const windows = this.windows.get(name) ?? [];
        const now = new Date();
        const current = windows[windows.length - 1];

        // Bucket into 1-minute windows
        if (
          current &&
          now.getTime() - current.timestamp.getTime() < 60_000
        ) {
          current.totalRequests++;
          if (good) current.goodRequests++;
        } else {
          windows.push({
            totalRequests: 1,
            goodRequests: good ? 1 : 0,
            timestamp: now,
          });
        }

        // Retain only windows within the SLO period
        const cutoff = now.getTime() - slo.windowHours * 3_600_000;
        this.windows.set(
          name,
          windows.filter((w) => w.timestamp.getTime() > cutoff),
        );
      }
    }
  }

  /**
   * Evaluate all SLOs and return any alerts.
   */
  evaluate(): BurnRateAlert[] {
    const alerts: BurnRateAlert[] = [];

    for (const [name, slo] of this.slos) {
      const windows = this.windows.get(name) ?? [];
      if (windows.length === 0) continue;

      // Fast burn: 6-hour window
      const fastBurn = this.evaluateWindow(name, slo, 6);
      if (fastBurn) alerts.push(fastBurn);

      // Slow burn: 72-hour (3-day) window
      const slowBurn = this.evaluateWindow(name, slo, 72);
      if (slowBurn) alerts.push(slowBurn);
    }

    return alerts;
  }

  private evaluateWindow(
    sloName: string,
    slo: SLODefinition,
    windowHours: number,
  ): BurnRateAlert | null {
    const windows = this.windows.get(sloName) ?? [];
    const cutoff = Date.now() - windowHours * 3_600_000;
    const relevantWindows = windows.filter(
      (w) => w.timestamp.getTime() > cutoff,
    );

    if (relevantWindows.length === 0) return null;

    const total = relevantWindows.reduce((s, w) => s + w.totalRequests, 0);
    const good = relevantWindows.reduce((s, w) => s + w.goodRequests, 0);

    if (total === 0) return null;

    const successRate = good / total;
    const burnRate = evaluateBurnRate(slo.target, successRate, windowHours, slo.windowHours);

    if (burnRate <= 1) return null;

    const errorBudget = 1 - slo.target;
    const budgetConsumed = ((1 - successRate) / errorBudget) * 100;
    const exhaustionHours =
      burnRate > 0 ? slo.windowHours / burnRate : null;

    const severity: BurnRateAlert['severity'] =
      windowHours <= 6 && burnRate >= 14.4
        ? 'page'
        : windowHours <= 6 && burnRate >= 6
          ? 'critical'
          : burnRate >= 3
            ? 'warning'
            : 'info';

    return BurnRateAlertSchema.parse({
      sloName,
      service: slo.service,
      burnRate: Math.round(burnRate * 100) / 100,
      budgetConsumedPercent: Math.round(budgetConsumed * 100) / 100,
      exhaustionHours: exhaustionHours ? Math.round(exhaustionHours) : null,
      severity,
      windowHours,
      timestamp: new Date(),
    });
  }
}

// ── Burn Rate Calculation ────────────────────────────────────────────────────

/**
 * Calculate the burn rate: how fast we're consuming error budget
 * relative to a uniform consumption over the SLO window.
 *
 * burn_rate = (observed_error_rate / allowed_error_rate)
 *           = (1 - success_rate) / (1 - target)
 *
 * A burn rate of 1 means we'll exactly consume the budget.
 * A burn rate of 14.4 means we'll exhaust the 30-day budget in ~50 hours.
 */
export function evaluateBurnRate(
  target: number,
  observedSuccessRate: number,
  _windowHours: number,
  _sloWindowHours: number,
): number {
  const errorBudget = 1 - target;
  if (errorBudget === 0) return Infinity;

  const observedErrorRate = 1 - observedSuccessRate;
  return observedErrorRate / errorBudget;
}
