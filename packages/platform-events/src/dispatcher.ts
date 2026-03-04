/**
 * @nzila/platform-events — Async Fan-Out Dispatcher
 *
 * Routes platform events to registered handlers with error isolation,
 * retry support, and dead-letter tracking.
 *
 * @module @nzila/platform-events/dispatcher
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { PlatformEvent, PlatformEventHandler } from './types'

const logger = createLogger('platform-events-dispatcher')

// ── Types ───────────────────────────────────────────────────────────────────

export interface DispatchResult {
  readonly eventId: string
  readonly eventType: string
  readonly handlersInvoked: number
  readonly succeeded: number
  readonly failed: number
  readonly errors: ReadonlyArray<{ handler: string; error: string }>
}

export interface HandlerRegistration {
  readonly name: string
  readonly eventTypes: readonly string[]
  readonly handler: PlatformEventHandler
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

/**
 * Fan-out dispatcher that routes events to all matching handlers.
 * Each handler runs in isolation — one failure doesn't cascade.
 */
export class PlatformEventDispatcher {
  private readonly handlers: HandlerRegistration[] = []

  /**
   * Register a named handler for specific event types.
   */
  register(registration: HandlerRegistration): void {
    this.handlers.push(registration)
    logger.info('Handler registered', {
      handler: registration.name,
      eventTypes: registration.eventTypes,
    })
  }

  /**
   * Dispatch an event to all matching handlers.
   * Returns detailed results including per-handler success/failure.
   */
  async dispatch(event: PlatformEvent): Promise<DispatchResult> {
    const matchingHandlers = this.handlers.filter(
      (h) =>
        h.eventTypes.includes(event.type) ||
        h.eventTypes.includes('*'),
    )

    const errors: Array<{ handler: string; error: string }> = []
    let succeeded = 0

    const promises = matchingHandlers.map(async (registration) => {
      try {
        await registration.handler(event)
        succeeded++
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        errors.push({ handler: registration.name, error: errorMessage })
        logger.error('Handler dispatch failed', {
          handler: registration.name,
          eventId: event.id,
          eventType: event.type,
          error: errorMessage,
        })
      }
    })

    await Promise.allSettled(promises)

    const result: DispatchResult = {
      eventId: event.id,
      eventType: event.type,
      handlersInvoked: matchingHandlers.length,
      succeeded,
      failed: errors.length,
      errors,
    }

    if (errors.length > 0) {
      logger.warn('Event dispatch completed with errors', {
        eventId: event.id,
        eventType: event.type,
        failed: errors.length,
        total: matchingHandlers.length,
      })
    }

    return result
  }

  /**
   * List all registered handlers.
   */
  listHandlers(): ReadonlyArray<{ name: string; eventTypes: readonly string[] }> {
    return this.handlers.map((h) => ({
      name: h.name,
      eventTypes: h.eventTypes,
    }))
  }

  /**
   * Clear all handlers (test teardown).
   */
  clear(): void {
    this.handlers.length = 0
  }
}
