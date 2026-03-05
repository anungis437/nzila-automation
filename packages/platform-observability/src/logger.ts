/**
 * @nzila/platform-observability — Structured Event Logger
 *
 * Enterprise-grade structured logger that produces deterministic,
 * machine-parseable log events for every API route and system operation.
 *
 * Every log entry includes:
 *   - event: operation identifier
 *   - severity: log level
 *   - request_id: per-request unique ID
 *   - correlation_id: cross-service correlation
 *   - org_id: organisation context
 *   - timestamp: ISO 8601 UTC (no ms)
 *   - metadata: arbitrary structured payload
 *
 * @module @nzila/platform-observability/logger
 */
import { randomUUID } from 'node:crypto'

// ── Types ───────────────────────────────────────────────────────────────────

export type Severity = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface StructuredLogEntry {
  readonly event: string
  readonly severity: Severity
  readonly request_id: string
  readonly correlation_id: string
  readonly org_id: string
  readonly timestamp: string
  readonly metadata: Record<string, unknown>
}

export interface LoggerContext {
  readonly request_id?: string
  readonly correlation_id?: string
  readonly org_id?: string
}

export type LogSink = (entry: StructuredLogEntry) => void

// ── Default Sink (stdout JSON) ──────────────────────────────────────────────

function defaultSink(entry: StructuredLogEntry): void {
  process.stdout.write(JSON.stringify(entry) + '\n')
}

// ── ISO UTC without ms ─────────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

// ── Logger Class ────────────────────────────────────────────────────────────

export class StructuredLogger {
  private readonly context: Required<LoggerContext>
  private readonly sink: LogSink

  constructor(context?: LoggerContext, sink?: LogSink) {
    this.context = {
      request_id: context?.request_id ?? randomUUID(),
      correlation_id: context?.correlation_id ?? randomUUID(),
      org_id: context?.org_id ?? 'system',
    }
    this.sink = sink ?? defaultSink
  }

  /**
   * Create a child logger with inherited correlation context.
   */
  child(overrides: Partial<LoggerContext>): StructuredLogger {
    return new StructuredLogger(
      {
        request_id: overrides.request_id ?? this.context.request_id,
        correlation_id: overrides.correlation_id ?? this.context.correlation_id,
        org_id: overrides.org_id ?? this.context.org_id,
      },
      this.sink,
    )
  }

  /**
   * Emit a structured log entry.
   */
  emit(severity: Severity, event: string, metadata: Record<string, unknown> = {}): void {
    const entry: StructuredLogEntry = {
      event,
      severity,
      request_id: this.context.request_id,
      correlation_id: this.context.correlation_id,
      org_id: this.context.org_id,
      timestamp: nowISO(),
      metadata,
    }
    this.sink(entry)
  }

  debug(event: string, metadata?: Record<string, unknown>): void {
    this.emit('debug', event, metadata)
  }

  info(event: string, metadata?: Record<string, unknown>): void {
    this.emit('info', event, metadata)
  }

  warn(event: string, metadata?: Record<string, unknown>): void {
    this.emit('warn', event, metadata)
  }

  error(event: string, metadata?: Record<string, unknown>): void {
    this.emit('error', event, metadata)
  }

  critical(event: string, metadata?: Record<string, unknown>): void {
    this.emit('critical', event, metadata)
  }

  /**
   * Create a request-scoped logger from HTTP headers.
   */
  static fromHeaders(
    headers: Record<string, string | string[] | undefined>,
    orgId?: string,
  ): StructuredLogger {
    const requestId =
      (Array.isArray(headers['x-request-id'])
        ? headers['x-request-id'][0]
        : headers['x-request-id']) ?? randomUUID()
    const correlationId =
      (Array.isArray(headers['x-correlation-id'])
        ? headers['x-correlation-id'][0]
        : headers['x-correlation-id']) ?? randomUUID()

    return new StructuredLogger({
      request_id: requestId,
      correlation_id: correlationId,
      org_id: orgId ?? 'unknown',
    })
  }
}

/**
 * Create a structured logger with the given context.
 */
export function createLogger(context?: LoggerContext, sink?: LogSink): StructuredLogger {
  return new StructuredLogger(context, sink)
}
