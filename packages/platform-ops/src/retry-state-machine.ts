/**
 * @nzila/platform-ops — Retry State Machine
 *
 * Manages retry state for workflow/job executions.
 * Tracks attempt count, computes next delay, and enforces max attempts.
 */
import type { RetryConfig } from './workflow-registry'

// ── Retry State ─────────────────────────────────────────────────────────────

export type RetryDecision = 'retry' | 'exhaust' | 'abort'

export interface RetryState {
  readonly attemptNumber: number
  readonly maxAttempts: number
  readonly lastError: string | null
  readonly nextDelayMs: number | null
  readonly decision: RetryDecision
  readonly exhausted: boolean
  readonly startedAt: string
  readonly lastAttemptAt: string | null
}

// ── State Machine ───────────────────────────────────────────────────────────

export interface RetryStateMachine {
  /** Current state snapshot */
  state(): RetryState
  /** Record a failed attempt and compute next action */
  recordFailure(error: string): RetryDecision
  /** Record a successful attempt */
  recordSuccess(): void
  /** Reset the state machine */
  reset(): void
}

/**
 * Create a retry state machine with the given config.
 */
export function createRetryStateMachine(config: RetryConfig): RetryStateMachine {
  let attemptNumber = 0
  let lastError: string | null = null
  let lastAttemptAt: string | null = null
  let exhausted = false
  const startedAt = new Date().toISOString()

  function computeDelay(attempt: number): number {
    const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1)
    return Math.min(delay, config.maxDelayMs)
  }

  return {
    state(): RetryState {
      const canRetry = attemptNumber < config.maxAttempts && !exhausted
      return {
        attemptNumber,
        maxAttempts: config.maxAttempts,
        lastError,
        nextDelayMs: canRetry && attemptNumber > 0 ? computeDelay(attemptNumber) : null,
        decision: exhausted ? 'exhaust' : canRetry ? 'retry' : 'exhaust',
        exhausted: attemptNumber >= config.maxAttempts,
        startedAt,
        lastAttemptAt,
      }
    },

    recordFailure(error: string): RetryDecision {
      attemptNumber++
      lastError = error
      lastAttemptAt = new Date().toISOString()

      if (attemptNumber >= config.maxAttempts) {
        exhausted = true
        return 'exhaust'
      }

      return 'retry'
    },

    recordSuccess() {
      lastAttemptAt = new Date().toISOString()
    },

    reset() {
      attemptNumber = 0
      lastError = null
      lastAttemptAt = null
      exhausted = false
    },
  }
}
