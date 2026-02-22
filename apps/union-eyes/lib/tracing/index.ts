/**
 * Distributed Tracing Exports
 * 
 * Centralized exports for all tracing utilities
 */

export {
  initializeTracing,
  shutdownTracing,
  getTraceContext as getOTelTraceContext,
} from './opentelemetry';

export {
  traced,
  startSpan,
  getTraceContext,
  addSpanEvent,
  setSpanAttributes,
  recordException,
  getTracer,
  TraceAttributes,
  SpanStatusCode,
  type Span,
  type Tracer,
} from './utils';
