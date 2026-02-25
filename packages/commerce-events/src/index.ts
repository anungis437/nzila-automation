/**
 * @nzila/commerce-events — Domain Events, Event Bus & Saga Infrastructure
 *
 * @module @nzila/commerce-events
 */

// ── Types ─────────────────────────────────────────────────────────────────
export type {
  DomainEvent,
  DomainEventMetadata,
  OutboxStatus,
  OutboxRecord,
  EventHandler,
  Unsubscribe,
  EventBus,
  SagaStatus,
  SagaStepResult,
  SagaStep,
  SagaContext,
  SagaDefinition,
  SagaExecution,
} from './types'

// ── Event Types ────────────────────────────────────────────────────────────
export { CommerceEventTypes } from './event-types'
export type { CommerceEventType } from './event-types'

// ── Event Bus ──────────────────────────────────────────────────────────────
export {
  InMemoryEventBus,
  createDomainEvent,
  domainEventsFromTransition,
} from './event-bus'

// ── Saga ────────────────────────────────────────────────────────────────────
export type { SagaOrchestrator } from './saga'
export { createSagaOrchestrator } from './saga'
