/**
 * @nzila/platform-observability — Correlation ID Middleware
 *
 * Manages correlation context (requestId, traceId, spanId) for
 * distributed tracing across the NzilaOS platform.
 *
 * Propagates via X-Request-Id, X-Trace-Id, X-Span-Id headers.
 * Integrates with @nzila/os-core/telemetry for automatic log injection.
 *
 * @module @nzila/platform-observability/correlation
 */
import { randomBytes } from 'node:crypto'
import type { CorrelationContext } from './types'

// ── ID Generation ───────────────────────────────────────────────────────────

/**
 * Generate a 32-char hex trace ID (W3C Trace Context compatible).
 */
export function generateTraceId(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Generate a 16-char hex span ID (W3C Trace Context compatible).
 */
export function generateSpanId(): string {
  return randomBytes(8).toString('hex')
}

/**
 * Generate a UUID-style request ID.
 */
export function generateRequestId(): string {
  return crypto.randomUUID()
}

// ── Context Management ──────────────────────────────────────────────────────

const HEADER_REQUEST_ID = 'x-request-id'
const HEADER_TRACE_ID = 'x-trace-id'
const HEADER_SPAN_ID = 'x-span-id'
const HEADER_ORG_ID = 'x-org-id'
const HEADER_TRACEPARENT = 'traceparent'

/**
 * Extract or create correlation context from incoming request headers.
 * Supports both custom headers and W3C Trace Context (traceparent).
 * Priority: explicit x-trace-id/x-span-id > traceparent > generate new.
 */
export function extractCorrelationContext(
  headers: Record<string, string | string[] | undefined>,
): CorrelationContext {
  const getHeader = (name: string): string | undefined => {
    const value = headers[name]
    return Array.isArray(value) ? value[0] : value
  }

  const orgId = getHeader(HEADER_ORG_ID)
  const requestId = getHeader(HEADER_REQUEST_ID) ?? generateRequestId()

  // Explicit headers take precedence
  const explicitTraceId = getHeader(HEADER_TRACE_ID)
  const explicitSpanId = getHeader(HEADER_SPAN_ID)

  if (explicitTraceId) {
    return {
      requestId,
      traceId: explicitTraceId,
      spanId: explicitSpanId ?? generateSpanId(),
      ...(orgId ? { orgId } : {}),
    }
  }

  // Fall back to W3C traceparent: 00-<trace-id>-<span-id>-<flags>
  const traceparent = getHeader(HEADER_TRACEPARENT)
  if (traceparent) {
    const parts = traceparent.split('-')
    if (parts.length === 4 && parts[1]!.length === 32 && parts[2]!.length === 16) {
      return {
        requestId,
        traceId: parts[1]!,
        spanId: parts[2]!,
        ...(orgId ? { orgId } : {}),
      }
    }
  }

  return {
    requestId,
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    ...(orgId ? { orgId } : {}),
  }
}

/**
 * Build outgoing headers from correlation context.
 * Includes both custom headers and W3C traceparent.
 */
export function buildCorrelationHeaders(
  context: CorrelationContext,
): Record<string, string> {
  const headers: Record<string, string> = {
    [HEADER_REQUEST_ID]: context.requestId,
    [HEADER_TRACE_ID]: context.traceId,
    [HEADER_SPAN_ID]: context.spanId,
  }

  // Only emit W3C traceparent for valid-length trace/span IDs
  if (context.traceId.length === 32 && context.spanId.length === 16) {
    headers[HEADER_TRACEPARENT] = `00-${context.traceId}-${context.spanId}-01`
  }

  if (context.orgId) {
    headers[HEADER_ORG_ID] = context.orgId
  }

  return headers
}

/**
 * Create a child context (new span, same trace).
 * Used when making downstream calls.
 */
export function createChildContext(
  parent: CorrelationContext,
): CorrelationContext {
  return {
    ...parent,
    spanId: generateSpanId(),
    parentSpanId: parent.spanId,
  }
}

// ── Correlation Propagation Wrappers ────────────────────────────────────────

/**
 * Minimal request-like object for header extraction.
 */
interface IncomingRequest {
  readonly headers: Record<string, string | string[] | undefined>
}

/**
 * Wraps an async handler (API route, job worker, event handler) so that
 * correlation context is automatically extracted from incoming headers
 * and injected as the first argument.
 *
 * @example
 *   const handler = withCorrelation(async (ctx, req, res) => {
 *     // ctx.traceId, ctx.requestId, ctx.spanId available
 *     const childHeaders = buildCorrelationHeaders(createChildContext(ctx))
 *     await fetch(downstream, { headers: childHeaders })
 *   })
 */
export function withCorrelation<
  TArgs extends [IncomingRequest, ...unknown[]],
  TReturn,
>(
  handler: (ctx: CorrelationContext, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const [req] = args
    const ctx = extractCorrelationContext(req.headers)
    return handler(ctx, ...args)
  }
}

/**
 * Wraps an async job/event handler that does not have request headers.
 * Creates a fresh root correlation context for the execution scope.
 *
 * @example
 *   const process = withFreshCorrelation(async (ctx, event) => {
 *     // ctx is a brand-new root context for this job
 *   })
 */
export function withFreshCorrelation<
  TArgs extends unknown[],
  TReturn,
>(
  handler: (ctx: CorrelationContext, ...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const ctx: CorrelationContext = {
      requestId: generateRequestId(),
      traceId: generateTraceId(),
      spanId: generateSpanId(),
    }
    return handler(ctx, ...args)
  }
}
