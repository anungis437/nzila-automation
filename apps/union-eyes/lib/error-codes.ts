/**
 * Stable Server Action Error Codes
 *
 * Every server action returns one of these codes when it fails.
 * Codes are part of the public API contract — never rename or remove
 * an existing code without a deprecation period.
 *
 * Convention:  DOMAIN_VERB_REASON
 *
 * @module lib/error-codes
 */

export const ErrorCode = {
  // ── Auth ──────────────────────────────────────────────────
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // ── Validation ────────────────────────────────────────────
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_FORMAT_ERROR: 'VALIDATION_FORMAT_ERROR',

  // ── Claims ────────────────────────────────────────────────
  CLAIM_NOT_FOUND: 'CLAIM_NOT_FOUND',
  CLAIM_ALREADY_EXISTS: 'CLAIM_ALREADY_EXISTS',
  CLAIM_STATUS_INVALID: 'CLAIM_STATUS_INVALID',
  CLAIM_ASSIGN_FAILED: 'CLAIM_ASSIGN_FAILED',

  // ── Organizations ─────────────────────────────────────────
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_CREATE_FAILED: 'ORG_CREATE_FAILED',
  ORG_UPDATE_FAILED: 'ORG_UPDATE_FAILED',
  ORG_SLUG_TAKEN: 'ORG_SLUG_TAKEN',

  // ── Members ───────────────────────────────────────────────
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  MEMBER_ROLE_UPDATE_FAILED: 'MEMBER_ROLE_UPDATE_FAILED',
  MEMBER_SEGMENT_NOT_FOUND: 'MEMBER_SEGMENT_NOT_FOUND',

  // ── Credits / Premium ─────────────────────────────────────
  CREDITS_EXHAUSTED: 'CREDITS_EXHAUSTED',
  CREDITS_RENEWAL_FAILED: 'CREDITS_RENEWAL_FAILED',
  PREMIUM_FEATURE_UNAVAILABLE: 'PREMIUM_FEATURE_UNAVAILABLE',

  // ── Analytics ─────────────────────────────────────────────
  ANALYTICS_INSUFFICIENT_DATA: 'ANALYTICS_INSUFFICIENT_DATA',
  ANALYTICS_UNSUPPORTED_MODEL: 'ANALYTICS_UNSUPPORTED_MODEL',

  // ── Admin ─────────────────────────────────────────────────
  ADMIN_CONFIG_UPDATE_FAILED: 'ADMIN_CONFIG_UPDATE_FAILED',

  // ── Export ────────────────────────────────────────────────
  EXPORT_FAILED: 'EXPORT_FAILED',
  EXPORT_NO_DATA: 'EXPORT_NO_DATA',

  // ── Infrastructure ────────────────────────────────────────
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Build a standard action error payload.
 * All server actions should use this for failures.
 */
export function actionError(
  code: ErrorCodeValue,
  message: string,
  meta?: Record<string, unknown>,
) {
  return {
    isSuccess: false as const,
    code,
    message,
    ...(meta ? { meta } : {}),
  };
}
