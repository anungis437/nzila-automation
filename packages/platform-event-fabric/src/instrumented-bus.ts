/**
 * @nzila/platform-event-fabric — Instrumented Event Bus
 *
 * Wraps the core event bus with structured telemetry:
 *   publish → event_published (counter + log)
 *   handler error → event_handler_error (counter + log)
 *   subscribe/subscribeAll → subscription tracking
 */
import type { PlatformEvent, PlatformEventBus, PlatformEventHandler, Unsubscribe } from './types'
import { createPlatformEventBus, type CreateEventBusOptions } from './bus'
import {
  workflowTelemetry,
  governanceTelemetry,
  govAuditEvents,
} from '@nzila/platform-observability'
import { createLogger } from '@nzila/platform-observability'
import { Counter, Histogram, globalRegistry } from '@nzila/platform-observability'

// ── Dedicated event-fabric metrics ──────────────────────────────────────────

const eventPublishCount = globalRegistry.createCounter(
  'event_fabric_publish_total',
  'Total events published through the event bus',
)
const eventHandlerErrors = globalRegistry.createCounter(
  'event_fabric_handler_errors_total',
  'Total handler errors during event dispatch',
)
const eventPublishLatency = globalRegistry.createHistogram(
  'event_fabric_publish_latency_ms',
  'Event bus publish latency in ms',
)
const eventSubscriptionCount = globalRegistry.createGauge(
  'event_fabric_subscriptions_active',
  'Currently active event subscriptions',
)

const logger = createLogger({ org_id: 'platform' })

// ── Instrumented Event Bus Factory ──────────────────────────────────────────

/**
 * Creates a platform event bus with full telemetry instrumentation.
 *
 * Every publish emits:
 *  - `event_fabric_publish_total` counter
 *  - `event_fabric_publish_latency_ms` histogram
 *  - Structured log: `event_published`
 *  - Governance audit event via `governanceTelemetry`
 *
 * Handler errors emit:
 *  - `event_fabric_handler_errors_total` counter
 *  - Structured log: `event_handler_error`
 */
export function createInstrumentedEventBus(
  options: CreateEventBusOptions = {},
): PlatformEventBus {
  const governance = governanceTelemetry('platform')

  // Wrap onError to capture handler errors
  const originalOnError = options.onError
  const instrumentedOptions: CreateEventBusOptions = {
    ...options,
    onError(error, event) {
      eventHandlerErrors.inc()
      logger.error('event_handler_error', {
        eventType: event.type,
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      })
      originalOnError?.(error, event)
    },
  }

  const inner = createPlatformEventBus(instrumentedOptions)

  return {
    async publish(event: PlatformEvent) {
      const startMs = performance.now()
      eventPublishCount.inc()

      logger.info('event_published', {
        eventType: event.type,
        eventId: event.id,
        source: event.metadata.source,
        actor: event.metadata.actor,
      })

      governance.auditEmitted('event_published', {
        eventType: event.type,
        eventId: event.id,
      })

      await inner.publish(event)

      const durationMs = Math.round(performance.now() - startMs)
      eventPublishLatency.observe(durationMs)
    },

    subscribe(eventType, handler) {
      eventSubscriptionCount.inc()
      logger.debug('event_subscribed', { eventType })

      const unsub = inner.subscribe(eventType, handler)
      return () => {
        eventSubscriptionCount.dec()
        logger.debug('event_unsubscribed', { eventType })
        unsub()
      }
    },

    subscribeAll(handler) {
      eventSubscriptionCount.inc()
      logger.debug('event_subscribed_all', {})

      const unsub = inner.subscribeAll(handler)
      return () => {
        eventSubscriptionCount.dec()
        logger.debug('event_unsubscribed_all', {})
        unsub()
      }
    },

    async replay(eventType, since) {
      logger.info('event_replay_requested', { eventType, since })
      return inner.replay(eventType, since)
    },

    clear() {
      logger.info('event_bus_cleared', {})
      inner.clear()
    },
  }
}
