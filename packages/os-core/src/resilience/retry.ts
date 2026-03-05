/**
 * Retry with Exponential Backoff + Jitter
 *
 * Retries a function with increasing delays and random jitter
 * to prevent thundering herd on recovery.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first) */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier (default: 2) */
  multiplier: number;
  /** Jitter factor (0-1, default: 0.1) */
  jitter: number;
  /** Optional: only retry certain errors */
  retryIf?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 200,
  maxDelayMs: 10_000,
  multiplier: 2,
  jitter: 0.1,
};

/**
 * Execute a function with retry logic.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (opts.retryIf && !opts.retryIf(error)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt === opts.maxAttempts) break;

      // Wait with jitter
      const jitteredDelay = delay + delay * opts.jitter * (Math.random() * 2 - 1);
      await sleep(Math.min(jitteredDelay, opts.maxDelayMs));

      delay *= opts.multiplier;
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
