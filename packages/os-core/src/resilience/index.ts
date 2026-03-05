/**
 * Resilience Patterns for Nzila OS
 *
 * Provides:
 * - Circuit breaker (prevents cascade failures)
 * - Bulkhead (limits concurrent operations)
 * - Retry with exponential backoff + jitter
 * - Timeout wrapper
 * - Fallback chains
 *
 * All patterns emit OTel-compatible events and integrate with
 * the evidence system for compliance reporting.
 */

export { CircuitBreaker, type CircuitBreakerOptions, type CircuitState } from './circuit-breaker.js';
export { Bulkhead, type BulkheadOptions } from './bulkhead.js';
export { retry, type RetryOptions } from './retry.js';
export { withTimeout, type TimeoutOptions } from './timeout.js';
