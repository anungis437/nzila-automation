/**
 * @nzila/platform-event-fabric — Event Bus Implementation
 *
 * In-process event bus with optional persistence and replay.
 */
import type {
  PlatformEvent,
  PlatformEventBus,
  PlatformEventHandler,
  PlatformEventStore,
} from './types'

// ── In-Memory Event Store ───────────────────────────────────────────────────

export function createInMemoryEventStore(): PlatformEventStore {
  const events: PlatformEvent[] = []

  return {
    async persist(event) {
      events.push(event)
    },

    async query(eventType, since, tenantId) {
      const sinceDate = new Date(since).getTime()
      return events.filter(
        (e) =>
          e.type === eventType &&
          new Date(e.createdAt).getTime() >= sinceDate &&
          (!tenantId || e.metadata.tenantId === tenantId),
      )
    },
  }
}

// ── Event Bus ───────────────────────────────────────────────────────────────

export interface CreateEventBusOptions {
  store?: PlatformEventStore
  onError?: (error: unknown, event: PlatformEvent) => void
}

export function createPlatformEventBus(
  options: CreateEventBusOptions = {},
): PlatformEventBus {
  const { store, onError } = options
  const handlers = new Map<string, Set<PlatformEventHandler>>()
  const globalHandlers = new Set<PlatformEventHandler>()

  function getHandlersFor(eventType: string): Set<PlatformEventHandler> {
    let set = handlers.get(eventType)
    if (!set) {
      set = new Set()
      handlers.set(eventType, set)
    }
    return set
  }

  return {
    async publish(event) {
      // Persist first (if store available)
      if (store) {
        await store.persist(event)
      }

      // Notify type-specific handlers
      const typeHandlers = handlers.get(event.type)
      if (typeHandlers) {
        for (const handler of typeHandlers) {
          try {
            await handler(event)
          } catch (error) {
            onError?.(error, event)
          }
        }
      }

      // Notify global handlers
      for (const handler of globalHandlers) {
        try {
          await handler(event)
        } catch (error) {
          onError?.(error, event)
        }
      }
    },

    subscribe(eventType, handler) {
      const set = getHandlersFor(eventType)
      set.add(handler)
      return () => {
        set.delete(handler)
      }
    },

    subscribeAll(handler) {
      globalHandlers.add(handler)
      return () => {
        globalHandlers.delete(handler)
      }
    },

    async replay(eventType, since) {
      if (!store) return []
      return store.query(eventType, since)
    },

    clear() {
      handlers.clear()
      globalHandlers.clear()
    },
  }
}
