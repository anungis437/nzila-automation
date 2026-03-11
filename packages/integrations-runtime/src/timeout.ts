/**
 * Nzila OS — Integration Runtime: Timeout Handling
 *
 * Wraps adapter calls with configurable per-provider timeouts.
 * Rejects with a typed TimeoutError if the operation exceeds the budget.
 *
 * @invariant INTEGRATION_TIMEOUT_001
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface TimeoutConfig {
  /** Default timeout in ms (applies when no provider override) */
  readonly defaultMs: number
  /** Per-provider overrides */
  readonly overrides: Readonly<Record<string, number>>
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  defaultMs: 15_000,
  overrides: {
    slack: 10_000,
    teams: 10_000,
    hubspot: 20_000,
    twilio: 12_000,
    resend: 10_000,
    sendgrid: 15_000,
    mailgun: 15_000,
    firebase: 12_000,
  },
}

// ── Timeout Error ───────────────────────────────────────────────────────────

export class TimeoutError extends Error {
  readonly code = 'INTEGRATION_TIMEOUT' as const
  readonly provider: string
  readonly budgetMs: number

  constructor(provider: string, budgetMs: number) {
    super(`Integration timeout: ${provider} exceeded ${budgetMs}ms budget`)
    this.name = 'TimeoutError'
    this.provider = provider
    this.budgetMs = budgetMs
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getTimeoutMs(provider: string, config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG): number {
  return config.overrides[provider] ?? config.defaultMs
}

/**
 * Execute `fn` with a timeout budget. Rejects with TimeoutError on expiry.
 * The underlying operation is NOT cancelled — callers must handle cleanup.
 */
export async function withTimeout<T>(
  provider: string,
  fn: () => Promise<T>,
  config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG,
): Promise<T> {
  const budgetMs = getTimeoutMs(provider, config)

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(provider, budgetMs))
    }, budgetMs)

    fn().then(
      (result) => {
        clearTimeout(timer)
        resolve(result)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
