/**
 * Nzila OS — Integration Runtime: Classified Retry
 *
 * Retry engine that uses platform-ops failure classification to
 * decide whether to retry, how long to back off, and when to
 * direct failures to the dead-letter queue.
 *
 * Bridges:
 *   - classifyFailure()  from @nzila/platform-ops
 *   - RetryStateMachine   from @nzila/platform-ops
 *   - withTimeout()       from ./timeout
 *
 * @invariant INTEGRATION_CLASSIFIED_RETRY_001
 */
import type { SendResult } from '@nzila/integrations-core'
import { classifyFailure, createRetryStateMachine, type RetryConfig } from '@nzila/platform-ops'
import { withTimeout, type TimeoutConfig, DEFAULT_TIMEOUT_CONFIG } from './timeout'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ClassifiedRetryConfig {
  readonly retry: RetryConfig
  readonly timeout: TimeoutConfig
}

export const DEFAULT_CLASSIFIED_RETRY_CONFIG: ClassifiedRetryConfig = {
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1_000,
    maxDelayMs: 30_000,
    backoffMultiplier: 2,
  },
  timeout: DEFAULT_TIMEOUT_CONFIG,
}

export interface ClassifiedRetryResult {
  /** Final result from the adapter */
  readonly result: SendResult
  /** Total attempts made */
  readonly attempts: number
  /** Classification of the failure (if any) */
  readonly classification?: {
    readonly failureClass: string
    readonly category: string
    readonly retryable: boolean
    readonly suggestedAction: string
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Classified retry executor ───────────────────────────────────────────────

/**
 * Execute a send operation with classified retries.
 *
 * On each failure:
 * 1. Classifies the error via `classifyFailure()`
 * 2. If not retryable → returns immediately (permanent failure)
 * 3. If retryable → backs off via RetryStateMachine and retries
 * 4. If all attempts exhausted → returns last failure
 */
export async function executeWithClassifiedRetry(
  provider: string,
  fn: () => Promise<SendResult>,
  config: ClassifiedRetryConfig = DEFAULT_CLASSIFIED_RETRY_CONFIG,
): Promise<ClassifiedRetryResult> {
  const sm = createRetryStateMachine(config.retry)
  let lastResult: SendResult = { ok: false, error: 'No attempts made' }
  let lastClassification: ClassifiedRetryResult['classification'] | undefined

  for (let attempt = 1; attempt <= config.retry.maxAttempts; attempt++) {
    try {
      const result = await withTimeout(provider, fn, config.timeout)

      if (result.ok) {
        sm.recordSuccess()
        return { result, attempts: attempt }
      }

      // Adapter returned ok: false — classify the error
      const classified = classifyFailure({ message: result.error ?? 'Unknown error' })
      lastClassification = {
        failureClass: classified.failureClass,
        category: classified.category,
        retryable: classified.retryable,
        suggestedAction: classified.suggestedAction,
      }
      lastResult = result

      // Permanent failure — no retry
      if (!classified.retryable) {
        return { result, attempts: attempt, classification: lastClassification }
      }

      // Try to get another attempt from the state machine
      const decision = sm.recordFailure(result.error ?? 'Unknown error')
      if (decision !== 'retry') {
        return { result, attempts: attempt, classification: lastClassification }
      }

      // Back off before next attempt
      const delayMs = sm.state().nextDelayMs ?? config.retry.initialDelayMs
      await sleep(delayMs)
    } catch (err) {
      // Exception thrown (timeout, network, etc.)
      const errMessage = err instanceof Error ? err.message : String(err)
      const classified = classifyFailure({ message: errMessage })
      lastClassification = {
        failureClass: classified.failureClass,
        category: classified.category,
        retryable: classified.retryable,
        suggestedAction: classified.suggestedAction,
      }
      lastResult = { ok: false, error: errMessage }

      if (!classified.retryable) {
        return { result: lastResult, attempts: attempt, classification: lastClassification }
      }

      const decision = sm.recordFailure(errMessage)
      if (decision !== 'retry') {
        return { result: lastResult, attempts: attempt, classification: lastClassification }
      }

      const delayMs = sm.state().nextDelayMs ?? config.retry.initialDelayMs
      await sleep(delayMs)
    }
  }

  return { result: lastResult, attempts: config.retry.maxAttempts, classification: lastClassification }
}
