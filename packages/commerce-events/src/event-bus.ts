/**
 * @nzila/commerce-events — In-Memory Event Bus
 *
 * Thread-safe, typed, in-memory event bus for the commerce engine.
 * Designed to be swapped for an outbox-backed or Azure Service Bus
 * implementation without changing consumer code.
 *
 * DESIGN:
 *   - Subscribers keyed by event type + wildcard channel
 *   - Fire-and-forget (emit) and await-all (emitAndWait) modes
 *   - Error isolation — one handler failure doesn't break others
 *   - Unsubscribe via returned cleanup function
 *   - clear() for test teardown
 *
 * @module @nzila/commerce-events/bus
 */
import type {
  DomainEvent,
  DomainEventMetadata,
  EventBus,
  EventHandler,
  Unsubscribe,
} from './types'

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a DomainEvent from minimal inputs.
 * Generates UUID for id and ISO timestamp.
 */
export function createDomainEvent<TPayload = Record<string, unknown>>(
  type: string,
  payload: TPayload,
  metadata: Omit<DomainEventMetadata, 'causationId' | 'source'> & {
    causationId?: string | null
    source?: string
  },
): DomainEvent<TPayload> {
  return {
    id: crypto.randomUUID(),
    type,
    payload: Object.freeze(payload) as Readonly<TPayload>,
    metadata: {
      orgId: metadata.orgId,
      actorId: metadata.actorId,
      correlationId: metadata.correlationId,
      causationId: metadata.causationId ?? null,
      source: metadata.source ?? 'commerce-events',
    },
    createdAt: new Date().toISOString(),
  }
}

/**
 * Build multiple DomainEvents from a TransitionSuccess.eventsToEmit array.
 * Convenience bridge between commerce-state and commerce-events.
 */
export function domainEventsFromTransition(
  eventsToEmit: readonly { type: string; payload: Record<string, unknown> }[],
  meta: {
    orgId: string
    actorId: string
    correlationId: string
    causationId?: string | null
    source?: string
  },
): DomainEvent[] {
  return eventsToEmit.map((e) =>
    createDomainEvent(e.type, e.payload, {
      orgId: meta.orgId,
      actorId: meta.actorId,
      correlationId: meta.correlationId,
      causationId: meta.causationId ?? null,
      source: meta.source ?? 'commerce-events',
    }),
  )
}

// ── In-Memory Implementation ────────────────────────────────────────────────

interface Subscription {
  handler: EventHandler
  once: boolean
}

/**
 * In-memory event bus.
 * Suitable for single-process deployments and testing.
 * For distributed deployments, wrap with an outbox writer.
 */
export class InMemoryEventBus implements EventBus {
  private readonly subscribers = new Map<string, Set<Subscription>>()
  private readonly wildcardSubscribers = new Set<Subscription>()
  private readonly WILDCARD = '__all__'

  // ── on ──────────────────────────────────────────────────────────────────

  on<TPayload = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<TPayload>,
  ): Unsubscribe {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }

    const sub: Subscription = {
      handler: handler as EventHandler,
      once: false,
    }

    this.subscribers.get(eventType)!.add(sub)

    return () => {
      this.subscribers.get(eventType)?.delete(sub)
    }
  }

  // ── onAny ───────────────────────────────────────────────────────────────

  onAny(handler: EventHandler): Unsubscribe {
    const sub: Subscription = { handler, once: false }
    this.wildcardSubscribers.add(sub)

    return () => {
      this.wildcardSubscribers.delete(sub)
    }
  }

  // ── once ────────────────────────────────────────────────────────────────

  once<TPayload = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<TPayload>,
  ): Unsubscribe {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }

    const sub: Subscription = {
      handler: handler as EventHandler,
      once: true,
    }

    this.subscribers.get(eventType)!.add(sub)

    return () => {
      this.subscribers.get(eventType)?.delete(sub)
    }
  }

  // ── emit (fire-and-forget) ──────────────────────────────────────────────

  emit(event: DomainEvent): void {
    this.dispatch(event)
  }

  // ── emitAndWait ─────────────────────────────────────────────────────────

  async emitAndWait(event: DomainEvent): Promise<void> {
    await this.dispatchAsync(event)
  }

  // ── emitBatch ───────────────────────────────────────────────────────────

  emitBatch(events: readonly DomainEvent[]): void {
    for (const event of events) {
      this.dispatch(event)
    }
  }

  // ── emitBatchAndWait ────────────────────────────────────────────────────

  async emitBatchAndWait(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.dispatchAsync(event)
    }
  }

  // ── clear ───────────────────────────────────────────────────────────────

  clear(): void {
    this.subscribers.clear()
    this.wildcardSubscribers.clear()
  }

  // ── Internal dispatch ───────────────────────────────────────────────────

  private dispatch(event: DomainEvent): void {
    const handlers = this.collectHandlers(event.type)
    for (const sub of handlers) {
      try {
        sub.handler(event)
      } catch {
        // Error isolation — one handler failure doesn't break others
      }
      if (sub.once) {
        this.removeSubscription(event.type, sub)
      }
    }
  }

  private async dispatchAsync(event: DomainEvent): Promise<void> {
    const handlers = this.collectHandlers(event.type)
    const promises: Promise<void>[] = []

    for (const sub of handlers) {
      try {
        const result = sub.handler(event)
        if (result instanceof Promise) {
          promises.push(
            result.catch(() => {
              // Error isolation
            }),
          )
        }
      } catch {
        // Error isolation
      }
      if (sub.once) {
        this.removeSubscription(event.type, sub)
      }
    }

    await Promise.all(promises)
  }

  private collectHandlers(eventType: string): Subscription[] {
    const typed = this.subscribers.get(eventType)
    const all: Subscription[] = []

    if (typed) {
      for (const sub of typed) {
        all.push(sub)
      }
    }

    for (const sub of this.wildcardSubscribers) {
      all.push(sub)
    }

    return all
  }

  private removeSubscription(eventType: string, sub: Subscription): void {
    this.subscribers.get(eventType)?.delete(sub)
    this.wildcardSubscribers.delete(sub)
  }
}
