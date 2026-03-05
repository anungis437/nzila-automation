/**
 * Platform RUM — Types
 *
 * Type definitions for Real User Monitoring metrics collection.
 */

import { z } from 'zod';

export const WebVitalMetricSchema = z.object({
  /** Metric name: CLS, FID, FCP, INP, LCP, TTFB */
  name: z.enum(['CLS', 'FID', 'FCP', 'INP', 'LCP', 'TTFB']),
  /** Numeric value of the metric */
  value: z.number(),
  /** Rating: good, needs-improvement, poor */
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  /** Delta since last report */
  delta: z.number(),
  /** Unique metric id */
  id: z.string(),
  /** Navigation type */
  navigationType: z.string().optional(),
});

export type WebVitalMetric = z.infer<typeof WebVitalMetricSchema>;

export const RUMEventSchema = z.object({
  /** Metric data */
  metric: WebVitalMetricSchema,
  /** Page URL pathname */
  pathname: z.string(),
  /** Org ID if authenticated */
  orgId: z.string().optional(),
  /** User agent string */
  userAgent: z.string().optional(),
  /** Connection effective type (4g, 3g, 2g, slow-2g) */
  connectionType: z.string().optional(),
  /** Device memory in GB */
  deviceMemory: z.number().optional(),
  /** Timestamp of collection */
  timestamp: z.date(),
  /** App name */
  appName: z.string(),
  /** Environment */
  environment: z.string(),
});

export type RUMEvent = z.infer<typeof RUMEventSchema>;

/** Thresholds per metric aligned with Google's Core Web Vitals */
export const WEB_VITAL_THRESHOLDS = {
  CLS:  { good: 0.1,   poor: 0.25  },
  FID:  { good: 100,   poor: 300   },
  FCP:  { good: 1800,  poor: 3000  },
  INP:  { good: 200,   poor: 500   },
  LCP:  { good: 2500,  poor: 4000  },
  TTFB: { good: 800,   poor: 1800  },
} as const;

export type WebVitalName = keyof typeof WEB_VITAL_THRESHOLDS;

export interface RUMReporterOptions {
  /** Target app name */
  appName: string;
  /** Endpoint to send RUM beacons to (POST) */
  endpoint?: string;
  /** Sample rate 0-1 (default: 1.0 — send everything) */
  sampleRate?: number;
  /** Batch size before flush (default: 10) */
  batchSize?: number;
  /** Max batch age in ms before flush (default: 5000) */
  flushIntervalMs?: number;
  /** Include device info (memory, connection) */
  includeDeviceInfo?: boolean;
}
