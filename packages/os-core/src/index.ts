/**
 * @nzila/os-core — barrel export
 */
export * from './types'
export { checkRateLimit, rateLimitHeaders } from './rateLimit'
export { evaluateGovernanceRequirements } from './policy'
export { getResolutionTemplate, listAvailableTemplates } from './templates'
export { computeEntryHash, verifyChain } from './hash'
export * from './evidence'
export * from './policy/index'
export * from './telemetry/index'
export * from './retention/index'
// Disambiguate: retention/policies has the authoritative RetentionClass (superset of evidence's version)
export { RetentionClass } from './retention/policies'
export { assertBootInvariants } from './boot-assert'
export {
  checkIdempotency,
  InMemoryIdempotencyCache,
  hashPayload,
  buildCacheKey,
  isStrictEnvironment,
  IDEMPOTENCY_HEADER,
  MUTATION_METHODS,
  getGlobalIdempotencyCache,
  requireIdempotencyKey,
  recordIdempotentResponse,
  resolveIdempotentReplay,
  isMutationApiRoute,
  isIdempotencyExempt,
  cleanupExpiredIdempotencyEntries,
  IDEMPOTENCY_EXEMPT_PATTERNS,
  type IdempotencyCache,
  type CachedIdempotencyEntry,
  type IdempotencyCheckOptions,
  type IdempotencyResult,
} from './idempotency'
