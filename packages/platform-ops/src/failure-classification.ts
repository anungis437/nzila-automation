/**
 * @nzila/platform-ops — Failure Classification
 *
 * Categorize failures into actionable classes: transient, permanent, unknown.
 * Each class drives retry/escalation behavior.
 */

// ── Failure Classes ─────────────────────────────────────────────────────────

export type FailureClass = 'transient' | 'permanent' | 'unknown'
export type FailureCategory =
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'auth'
  | 'validation'
  | 'resource_not_found'
  | 'provider_error'
  | 'internal'
  | 'configuration'
  | 'quota_exceeded'
  | 'unknown'

export interface ClassifiedFailure {
  readonly failureClass: FailureClass
  readonly category: FailureCategory
  readonly retryable: boolean
  readonly message: string
  readonly suggestedAction: string
}

// ── Classification Rules ────────────────────────────────────────────────────

interface ClassificationRule {
  readonly test: (error: { message: string; code?: string; statusCode?: number }) => boolean
  readonly failureClass: FailureClass
  readonly category: FailureCategory
  readonly retryable: boolean
  readonly suggestedAction: string
}

const RULES: readonly ClassificationRule[] = [
  {
    test: (e) => e.statusCode === 429 || /rate.?limit/i.test(e.message),
    failureClass: 'transient',
    category: 'rate_limit',
    retryable: true,
    suggestedAction: 'Back off and retry with exponential delay',
  },
  {
    test: (e) => /timeout|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(e.message),
    failureClass: 'transient',
    category: 'timeout',
    retryable: true,
    suggestedAction: 'Retry with increased timeout',
  },
  {
    test: (e) => /ECONNREFUSED|ECONNRESET|ENOTFOUND|network/i.test(e.message),
    failureClass: 'transient',
    category: 'network',
    retryable: true,
    suggestedAction: 'Check network connectivity and retry',
  },
  {
    test: (e) => e.statusCode === 503 || e.statusCode === 502 || e.statusCode === 504,
    failureClass: 'transient',
    category: 'provider_error',
    retryable: true,
    suggestedAction: 'Provider temporarily unavailable, retry',
  },
  {
    test: (e) => e.statusCode === 401 || e.statusCode === 403 || /unauthorized|forbidden/i.test(e.message),
    failureClass: 'permanent',
    category: 'auth',
    retryable: false,
    suggestedAction: 'Check credentials and permissions',
  },
  {
    test: (e) => e.statusCode === 400 || /validation|invalid|schema/i.test(e.message),
    failureClass: 'permanent',
    category: 'validation',
    retryable: false,
    suggestedAction: 'Fix input data and resubmit',
  },
  {
    test: (e) => e.statusCode === 404 || /not.?found/i.test(e.message),
    failureClass: 'permanent',
    category: 'resource_not_found',
    retryable: false,
    suggestedAction: 'Verify resource exists',
  },
  {
    test: (e) => /quota|limit exceeded/i.test(e.message),
    failureClass: 'permanent',
    category: 'quota_exceeded',
    retryable: false,
    suggestedAction: 'Increase quota or wait for reset',
  },
  {
    test: (e) => /config|missing.?env|not.?configured/i.test(e.message),
    failureClass: 'permanent',
    category: 'configuration',
    retryable: false,
    suggestedAction: 'Fix configuration',
  },
]

// ── Classify ────────────────────────────────────────────────────────────────

/**
 * Classify a failure into a structured category with retry/escalation guidance.
 */
export function classifyFailure(error: {
  message: string
  code?: string
  statusCode?: number
}): ClassifiedFailure {
  for (const rule of RULES) {
    if (rule.test(error)) {
      return {
        failureClass: rule.failureClass,
        category: rule.category,
        retryable: rule.retryable,
        message: error.message,
        suggestedAction: rule.suggestedAction,
      }
    }
  }

  return {
    failureClass: 'unknown',
    category: 'unknown',
    retryable: false,
    message: error.message,
    suggestedAction: 'Investigate manually and update classification rules',
  }
}

/**
 * Check if a failure is retryable.
 */
export function isRetryable(error: {
  message: string
  code?: string
  statusCode?: number
}): boolean {
  return classifyFailure(error).retryable
}
