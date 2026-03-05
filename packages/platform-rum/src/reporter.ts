/**
 * Platform RUM — Server-Side Reporter
 *
 * Receives batched RUM events from the client, validates them,
 * and emits OpenTelemetry metrics for dashboard consumption.
 *
 * Usage (Next.js API route):
 * ```ts
 * // app/api/rum/route.ts
 * import { handleRUMBeacon } from '@nzila/platform-rum/reporter';
 *
 * export async function POST(req: Request) {
 *   return handleRUMBeacon(req);
 * }
 * ```
 */

import { z } from 'zod';
import { RUMEventSchema, WEB_VITAL_THRESHOLDS, type RUMEvent, type WebVitalName } from './types.js';

const RUMBatchSchema = z.array(
  RUMEventSchema.extend({ timestamp: z.coerce.date() }),
);

export interface RUMSummary {
  received: number;
  valid: number;
  invalid: number;
  byMetric: Record<string, { count: number; avgValue: number; poorCount: number }>;
}

/**
 * Process a batch of RUM events.
 *
 * Returns a summary and emits OTel metrics if available.
 */
export async function processRUMBatch(events: unknown[]): Promise<RUMSummary> {
  const parsed = RUMBatchSchema.safeParse(events);
  const valid: RUMEvent[] = parsed.success ? parsed.data : [];
  const invalid = Array.isArray(events) ? events.length - valid.length : 0;

  const byMetric: RUMSummary['byMetric'] = {};

  for (const event of valid) {
    const name = event.metric.name;
    if (!byMetric[name]) {
      byMetric[name] = { count: 0, avgValue: 0, poorCount: 0 };
    }
    const m = byMetric[name];
    m.avgValue = (m.avgValue * m.count + event.metric.value) / (m.count + 1);
    m.count++;
    if (event.metric.rating === 'poor') m.poorCount++;
  }

  // Emit OTel metrics if available
  await emitOTelMetrics(valid);

  return {
    received: Array.isArray(events) ? events.length : 0,
    valid: valid.length,
    invalid,
    byMetric,
  };
}

async function emitOTelMetrics(events: RUMEvent[]): Promise<void> {
  try {
    const { metrics } = await import('@opentelemetry/api');
    const meter = metrics.getMeter('nzila-rum');

    const histogram = meter.createHistogram('nzila.rum.web_vital', {
      description: 'Web Vital metric values from Real User Monitoring',
      unit: 'ms',
    });

    const poorCounter = meter.createCounter('nzila.rum.poor_vitals', {
      description: 'Count of Web Vital readings rated as poor',
    });

    for (const event of events) {
      const attrs = {
        'nzila.rum.metric_name': event.metric.name,
        'nzila.rum.rating': event.metric.rating,
        'nzila.rum.app': event.appName,
        'nzila.rum.pathname': event.pathname,
        ...(event.orgId ? { 'nzila.org.id': event.orgId } : {}),
        ...(event.connectionType ? { 'nzila.rum.connection': event.connectionType } : {}),
      };

      histogram.record(event.metric.value, attrs);

      if (event.metric.rating === 'poor') {
        poorCounter.add(1, attrs);
      }
    }
  } catch {
    // OTel not available — degrade gracefully
  }
}

/**
 * Next.js/Fastify-compatible beacon handler.
 *
 * Call from an API route that accepts POST with JSON body.
 */
export async function handleRUMBeacon(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const events = Array.isArray(body) ? body : [body];
    const summary = await processRUMBatch(events);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid RUM payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Check if Web Vitals for an app are healthy (>70% good ratings).
 */
export function isRUMHealthy(summary: RUMSummary, threshold = 0.3): boolean {
  for (const [, data] of Object.entries(summary.byMetric)) {
    if (data.count > 0 && data.poorCount / data.count > threshold) {
      return false;
    }
  }
  return true;
}
