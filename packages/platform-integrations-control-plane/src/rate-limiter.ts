/**
 * @nzila/platform-integrations-control-plane — Org-Scoped Rate Limiter
 *
 * Sliding-window rate limiter for outbound integration requests.
 * Prevents org-level API abuse and respects provider-side limits.
 *
 * @module @nzila/platform-integrations-control-plane/rate-limiter
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { RateLimitConfig, RateLimitStatus } from './types'

const logger = createLogger('integrations-rate-limiter')

// ── Sliding Window State ────────────────────────────────────────────────────

interface WindowState {
  timestamps: number[]
}

/**
 * In-memory, org+provider scoped sliding window rate limiter.
 * For distributed deployments, swap with a Redis-backed implementation.
 */
export class IntegrationRateLimiter {
  private readonly windows = new Map<string, WindowState>()
  private readonly configs = new Map<string, RateLimitConfig>()

  /**
   * Register or update rate limit config for an org+provider.
   */
  configure(config: RateLimitConfig): void {
    const key = this.key(config.orgId, config.provider)
    this.configs.set(key, config)
    logger.info('Rate limit configured', {
      orgId: config.orgId,
      provider: config.provider,
      maxPerMin: config.maxRequestsPerMinute,
      maxPerHr: config.maxRequestsPerHour,
    })
  }

  /**
   * Check if a request is allowed under rate limits.
   * If allowed, records the request. If not, returns throttled status.
   */
  checkAndRecord(orgId: string, provider: string): RateLimitStatus {
    const key = this.key(orgId, provider)
    const config = this.configs.get(key)

    if (!config) {
      // No config = no limit
      return {
        orgId,
        provider,
        currentMinuteCount: 0,
        currentHourCount: 0,
        isThrottled: false,
        resetAt: new Date(Date.now() + 60_000).toISOString(),
      }
    }

    const now = Date.now()
    const state = this.getOrCreateWindow(key)

    // Prune timestamps older than 1 hour
    state.timestamps = state.timestamps.filter((ts) => now - ts < 3_600_000)

    const minuteCount = state.timestamps.filter((ts) => now - ts < 60_000).length
    const hourCount = state.timestamps.length

    const isThrottled =
      minuteCount >= config.maxRequestsPerMinute ||
      hourCount >= config.maxRequestsPerHour

    if (!isThrottled) {
      state.timestamps.push(now)
    } else {
      logger.warn('Rate limit throttled', {
        orgId,
        provider,
        minuteCount,
        hourCount,
        maxPerMin: config.maxRequestsPerMinute,
        maxPerHr: config.maxRequestsPerHour,
      })
    }

    return {
      orgId,
      provider,
      currentMinuteCount: isThrottled ? minuteCount : minuteCount + 1,
      currentHourCount: isThrottled ? hourCount : hourCount + 1,
      isThrottled,
      resetAt: new Date(now + 60_000).toISOString(),
    }
  }

  /**
   * Get current rate limit status without recording.
   */
  status(orgId: string, provider: string): RateLimitStatus {
    const key = this.key(orgId, provider)
    const state = this.windows.get(key)
    const now = Date.now()

    if (!state) {
      return {
        orgId,
        provider,
        currentMinuteCount: 0,
        currentHourCount: 0,
        isThrottled: false,
        resetAt: new Date(now + 60_000).toISOString(),
      }
    }

    const minuteCount = state.timestamps.filter((ts) => now - ts < 60_000).length
    const hourCount = state.timestamps.filter((ts) => now - ts < 3_600_000).length

    const config = this.configs.get(key)
    const isThrottled = config
      ? minuteCount >= config.maxRequestsPerMinute ||
        hourCount >= config.maxRequestsPerHour
      : false

    return {
      orgId,
      provider,
      currentMinuteCount: minuteCount,
      currentHourCount: hourCount,
      isThrottled,
      resetAt: new Date(now + 60_000).toISOString(),
    }
  }

  /**
   * Reset rate limit state for an org+provider.
   */
  reset(orgId: string, provider: string): void {
    const key = this.key(orgId, provider)
    this.windows.delete(key)
  }

  /**
   * Clear all state (test teardown).
   */
  clear(): void {
    this.windows.clear()
    this.configs.clear()
  }

  private key(orgId: string, provider: string): string {
    return `${orgId}:${provider}`
  }

  private getOrCreateWindow(key: string): WindowState {
    let state = this.windows.get(key)
    if (!state) {
      state = { timestamps: [] }
      this.windows.set(key, state)
    }
    return state
  }
}
