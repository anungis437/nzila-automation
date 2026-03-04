/**
 * @nzila/platform-events — Platform Event Bus
 *
 * In-memory, typed event bus for the entire NzilaOS platform.
 * Compatible with the commerce-events InMemoryEventBus pattern but
 * supports the canonical PlatformEvent envelope.
 *
 * DESIGN:
 *   - Subscribers keyed by event type + wildcard channel
 *   - Fire-and-forget (emit) and await-all (emitAndWait) modes
 *   - Error isolation — one handler failure doesn't break others
 *   - Unsubscribe via returned cleanup function
 *   - clear() for test teardown
 *   - Optional EventStore injection for persistence
 *
 * @module @nzila/platform-events/bus
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  PlatformEvent,
  PlatformEventBusInterface,
  PlatformEventHandler,
  PlatformEventMetadata,
  EventStorePorts,
  Unsubscribe,
} from './types'

const logger = createLogger('platform-events')

// ── Factory ─────────────────────────────────────────────────────────────────

/**
 * Build a PlatformEvent from minimal inputs.
 * Generates UUID for id and ISO timestamp automatically.
 */
export function createPlatformEvent<TPayload = Record<string, unknown>>(
  type: string,
  payload: TPayload,
  metadata: Omit<PlatformEventMetadata, 'causationId' | 'source' | 'traceId' | 'spanId'> & {
    causationId?: string | null
    source?: string
    traceId?: string | null
    spanId?: string | null
  },
  schemaVersion = '1.0',
): PlatformEvent<TPayload> {
  return {
    id: crypto.randomUUID(),
    type,
    schemaVersion,
    payload: Object.freeze(payload) as Readonly<TPayload>,
    metadata: {
      orgId: metadata.orgId,
      actorId: metadata.actorId,
      correlationId: metadata.correlationId,
      causationId: metadata.causationId ?? null,
      source: metadata.source ?? 'platform',
      traceId: metadata.traceId ?? null,
      spanId: metadata.spanId ?? null,
    },
    createdAt: new Date().toISOString(),
  }
}

// ── Subscription ────────────────────────────────────────────────────────────

interface Subscription {
  handler: PlatformEventHandler
  once: boolean
}

// ── In-Memory Implementation ────────────────────────────────────────────────

export interface PlatformEventBusOptions {
  /** Optional event store for persistence */
  store?: EventStorePorts
}

/**
 * In-memory platform event bus.
 * Suitable for single-process deployments and testing.
 * For distributed deployments, wrap with an outbox writer.
 */
export class PlatformEventBus implements PlatformEventBusInterface {
  private readonly subscribers = new Map<string, Set<Subscription>>()
  private readonly wildcardSubscribers = new Set<Subscription>()
  private readonly store: EventStorePorts | undefined

  constructor(options: PlatformEventBusOptions = {}) {
    this.store = options.store
  }

  // ── on ──────────────────────────────────────────────────────────────────

  on<TPayload = Record<string, unknown>>(
    eventType: string,
    handler: PlatformEventHandler<TPayload>,
  ): Unsubscribe {
    const sub: Subscription = {
      handler: handler as PlatformEventHandler,
      once: false,
    }

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType)!.add(sub)

    return () => {
      this.subscribers.get(eventType)?.delete(sub)
    }
  }

  // ── once ────────────────────────────────────────────────────────────────

  once<TPayload = Record<string, unknown>>(
    eventType: string,
    handler: PlatformEventHandler<TPayload>,
  ): Unsubscribe {
    const sub: Subscription = {
      handler: handler as PlatformEventHandler,
      once: true,
    }

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType)!.add(sub)

    return () => {
      this.subscribers.get(eventType)?.delete(sub)
    }
  }

  // ── onAny ───────────────────────────────────────────────────────────────

  onAny(handler: PlatformEventHandler): Unsubscribe {
    const sub: Subscription = { handler, once: false }
    this.wildcardSubscribers.add(sub)
    return () => {
      this.wildcardSubscribers.delete(sub)
    }
  }

  // ── emit ────────────────────────────────────────────────────────────────

  emit(event: PlatformEvent): void {
    // Persist if store is available (fire-and-forget)
    if (this.store) {
      this.store.persist(event).catch((err: unknown) => {
        logger.error('Failed to persist platform event', {
          eventId: event.id,
          eventType: event.type,
          error: err instanceof Error ? err.message : String(err),
        })
      })
    }

    // Dispatch to type-specific subscribers
    const typeSubs = this.subscribers.get(event.type)
    if (typeSubs) {
      for (const sub of typeSubs) {
        try {
          const result = sub.handler(event)
          if (result instanceof Promise) {
            result.catch((err: unknown) => {
              logger.error('Platform event handler error (async)', {
                eventType: event.type,
                error: err instanceof Error ? err.message : String(err),
              })
            })
          }
        } catch (err: unknown) {
          logger.error('Platform event handler error (sync)', {
            eventType: event.type,
            error: err instanceof Error ? err.message : String(err),
          })
        }
        if (sub.once) typeSubs.delete(sub)
      }
    }

    // Dispatch to wildcard subscribers
    for (const sub of this.wildcardSubscribers) {
      try {
        const result = sub.handler(event)
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            logger.error('Platform wildcard handler error (async)', {
              eventType: event.type,
              error: err instanceof Error ? err.message : String(err),
            })
          })
        }
      } catch (err: unknown) {
        logger.error('Platform wildcard handler error (sync)', {
          eventType: event.type,
          error: err instanceof Error ? err.message : String(err),
        })
      }
      if (sub.once) this.wildcardSubscribers.delete(sub)
    }
  }

  // ── emitAndWait ─────────────────────────────────────────────────────────

  async emitAndWait(event: PlatformEvent): Promise<PromiseSettledResult<void>[]> {
    // Persist first if store is available
    if (this.store) {
      await this.store.persist(event)
    }

    const promises: Promise<void>[] = []

    // Collect type-specific handlers
    const typeSubs = this.subscribers.get(event.type)
    if (typeSubs) {
      for (const sub of typeSubs) {
        promises.push(Promise.resolve(sub.handler(event)))
        if (sub.once) typeSubs.delete(sub)
      }
    }

    // Collect wildcard handlers
    for (const sub of this.wildcardSubscribers) {
      promises.push(Promise.resolve(sub.handler(event)))
      if (sub.once) this.wildcardSubscribers.delete(sub)
    }

    return Promise.allSettled(promises)
  }

  // ── clear ───────────────────────────────────────────────────────────────

  clear(): void {
    this.subscribers.clear()
    this.wildcardSubscribers.clear()
  }
}
