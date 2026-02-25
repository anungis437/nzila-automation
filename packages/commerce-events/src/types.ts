/**
 * @nzila/commerce-events — Domain Event & Saga Types
 *
 * Defines the shape of domain events flowing through the commerce engine,
 * outbox records, and saga step/compensation definitions.
 *
 * @module @nzila/commerce-events/types
 */

// ── Domain Events ───────────────────────────────────────────────────────────

/**
 * A domain event produced by a state transition or side-effect action.
 * Carries full context for downstream consumers.
 */
export interface DomainEvent<TPayload = Record<string, unknown>> {
  /** Unique event ID (UUID) */
  readonly id: string
  /** Dot-namespaced event type, e.g. "quote.accepted", "order.confirmed" */
  readonly type: string
  /** Event payload */
  readonly payload: Readonly<TPayload>
  /** Metadata for tracing and org isolation */
  readonly metadata: DomainEventMetadata
  /** ISO timestamp when the event was created */
  readonly createdAt: string
}

export interface DomainEventMetadata {
  /** Org that owns this event */
  readonly entityId: string
  /** Actor who triggered the event */
  readonly actorId: string
  /** Correlation ID for tracing across saga steps */
  readonly correlationId: string
  /** Causation ID — the event that caused this event (for chaining) */
  readonly causationId: string | null
  /** Source module that produced the event */
  readonly source: string
}

// ── Outbox ──────────────────────────────────────────────────────────────────

/** Status of an outbox record */
export type OutboxStatus = 'pending' | 'dispatched' | 'failed'

/**
 * Outbox record — written in the same DB transaction as the state change.
 * A background worker polls pending records and dispatches them.
 */
export interface OutboxRecord<TPayload = Record<string, unknown>> {
  readonly id: string
  readonly event: DomainEvent<TPayload>
  readonly status: OutboxStatus
  readonly retryCount: number
  readonly maxRetries: number
  readonly lastError: string | null
  readonly createdAt: string
  readonly dispatchedAt: string | null
}

// ── Event Bus ───────────────────────────────────────────────────────────────

/**
 * Handler function for domain events.
 * Must be idempotent — events may be delivered more than once.
 */
export type EventHandler<TPayload = Record<string, unknown>> = (
  event: DomainEvent<TPayload>,
) => void | Promise<void>

/** Unsubscribe function returned by bus.on() */
export type Unsubscribe = () => void

/**
 * Event Bus interface — implementations can be in-memory, outbox-backed,
 * or external (Azure Service Bus, etc.)
 */
export interface EventBus {
  /** Subscribe to events of a given type */
  on<TPayload = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<TPayload>,
  ): Unsubscribe

  /** Subscribe to ALL events (wildcard) */
  onAny(handler: EventHandler): Unsubscribe

  /** Emit a single event (fire-and-forget) */
  emit(event: DomainEvent): void

  /** Emit and wait for all handlers to complete */
  emitAndWait(event: DomainEvent): Promise<void>

  /** Emit multiple events in order */
  emitBatch(events: readonly DomainEvent[]): void

  /** Emit multiple events and wait for all handlers */
  emitBatchAndWait(events: readonly DomainEvent[]): Promise<void>

  /** Clear all subscriptions (useful in tests) */
  clear(): void
}

// ── Saga ────────────────────────────────────────────────────────────────────

/** Status of a saga execution */
export type SagaStatus =
  | 'running'
  | 'completed'
  | 'compensating'
  | 'compensated'
  | 'failed'

/** Result of a single saga step execution */
export type SagaStepResult<T = unknown> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string }

/**
 * A single step in a saga.
 *
 * `execute` runs the forward action.
 * `compensate` runs if a later step fails (rollback).
 * Both receive the saga context for cross-step data sharing.
 */
export interface SagaStep<TContext extends Record<string, unknown> = Record<string, unknown>> {
  /** Human-readable step name for logging/audit */
  readonly name: string
  /** Forward action — mutates sagaContext on success */
  execute(ctx: SagaContext<TContext>): Promise<SagaStepResult>
  /** Compensation — reverts this step's changes */
  compensate(ctx: SagaContext<TContext>): Promise<SagaStepResult>
}

/**
 * Context shared across all steps in a saga execution.
 * Steps can read/write to `data` to pass results forward.
 */
export interface SagaContext<TData extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique saga execution ID */
  readonly sagaId: string
  /** Correlation ID for event tracing */
  readonly correlationId: string
  /** Org context */
  readonly entityId: string
  readonly actorId: string
  /** Mutable shared data — steps write results here for downstream steps */
  data: TData
}

/**
 * Definition of a saga — an ordered list of steps with a trigger event.
 */
export interface SagaDefinition<TContext extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique saga name, e.g. "quote-to-order" */
  readonly name: string
  /** Event type that triggers this saga */
  readonly triggerEvent: string
  /** Ordered steps — executed sequentially */
  readonly steps: readonly SagaStep<TContext>[]
}

/**
 * Record of a saga execution — for audit and debugging.
 */
export interface SagaExecution {
  readonly sagaId: string
  readonly sagaName: string
  readonly correlationId: string
  readonly entityId: string
  readonly actorId: string
  readonly status: SagaStatus
  readonly stepsCompleted: readonly string[]
  readonly stepsCompensated: readonly string[]
  readonly error: string | null
  readonly startedAt: string
  readonly completedAt: string | null
}
