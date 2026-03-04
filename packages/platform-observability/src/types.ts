/**
 * @nzila/platform-observability — Types
 *
 * Core observability types for correlation, tracing, metrics, and health checks.
 *
 * @module @nzila/platform-observability/types
 */
import { z } from 'zod'

// ── Trace Context (W3C compatible) ──────────────────────────────────────────

export interface TraceContext {
  /** 32-char hex trace ID */
  readonly traceId: string
  /** 16-char hex span ID */
  readonly spanId: string
  /** Parent span ID (null for root spans) */
  readonly parentSpanId: string | null
  /** Trace flags (e.g. sampled) */
  readonly traceFlags: number
}

export interface SpanData {
  readonly spanId: string
  readonly traceId: string
  readonly parentSpanId: string | null
  readonly operationName: string
  readonly serviceName: string
  readonly startTime: number
  readonly endTime: number | null
  readonly durationMs: number | null
  readonly status: 'ok' | 'error' | 'unset'
  readonly attributes: Record<string, string | number | boolean>
  readonly events: readonly SpanEvent[]
}

export interface SpanEvent {
  readonly name: string
  readonly timestamp: number
  readonly attributes: Record<string, string | number | boolean>
}

// ── Metrics ─────────────────────────────────────────────────────────────────

export type MetricType = 'counter' | 'gauge' | 'histogram'

export interface MetricDefinition {
  readonly name: string
  readonly type: MetricType
  readonly help: string
  readonly labels: readonly string[]
}

export interface MetricSample {
  readonly name: string
  readonly type: MetricType
  readonly value: number
  readonly labels: Record<string, string>
  readonly timestamp: number
}

// ── Health Check ────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'down'

export interface HealthCheckResult {
  readonly name: string
  readonly status: HealthStatus
  readonly message?: string
  readonly latencyMs: number
}

export interface HealthReport {
  readonly service: string
  readonly status: HealthStatus
  readonly checks: readonly HealthCheckResult[]
  readonly timestamp: string
}

// ── Correlation ─────────────────────────────────────────────────────────────

export interface CorrelationContext {
  readonly requestId: string
  readonly traceId: string
  readonly spanId: string
  readonly parentSpanId?: string
  readonly orgId?: string
  readonly userId?: string
}

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const traceContextSchema = z.object({
  traceId: z.string().regex(/^[a-f0-9]{32}$/, 'Must be 32 hex chars'),
  spanId: z.string().regex(/^[a-f0-9]{16}$/, 'Must be 16 hex chars'),
  parentSpanId: z.string().regex(/^[a-f0-9]{16}$/).nullable(),
  traceFlags: z.number().int().min(0).max(255),
})

export const healthCheckResultSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'down']),
  message: z.string().optional(),
  latencyMs: z.number().nonnegative(),
})
