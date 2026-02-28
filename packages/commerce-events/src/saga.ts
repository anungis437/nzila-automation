/**
 * @nzila/commerce-events — Saga Orchestrator
 *
 * Executes multi-step sagas with automatic compensation on failure.
 *
 * DESIGN RULES:
 *   1. Steps execute sequentially — each can read results from prior steps
 *   2. On failure, completed steps are compensated in reverse order
 *   3. Every execution produces a SagaExecution record for audit
 *   4. Sagas are triggered by domain events via the event bus
 *   5. No direct DB access — side effects happen inside step implementations
 *
 * Usage:
 * ```ts
 * const orchestrator = createSagaOrchestrator(bus)
 * orchestrator.register(quoteToOrderSaga)
 *
 * // When 'quote.accepted' fires, the saga runs automatically
 * bus.emit(createDomainEvent('quote.accepted', { quoteId: 'q-1' }, meta))
 * ```
 *
 * @module @nzila/commerce-events/saga
 */
import type {
  DomainEvent,
  EventBus,
  SagaContext,
  SagaDefinition,
  SagaExecution,
  SagaStatus,
  SagaStep,
  SagaStepResult,
  Unsubscribe,
} from './types'

// ── Saga Orchestrator ───────────────────────────────────────────────────────

export interface SagaOrchestrator {
  /** Register a saga definition — auto-subscribes to its trigger event */
  register<TContext extends Record<string, unknown>>(
    saga: SagaDefinition<TContext>,
  ): Unsubscribe

  /**
   * Execute a saga manually (bypassing event trigger).
   * Useful for testing and imperative flows.
   */
  execute<TContext extends Record<string, unknown>>(
    saga: SagaDefinition<TContext>,
    ctx: SagaContext<TContext>,
  ): Promise<SagaExecution>

  /** Get all registered saga names */
  registeredSagas(): readonly string[]

  /** Get execution history (for debugging / audit) */
  executions(): readonly SagaExecution[]

  /** Clear execution history (for tests) */
  clearHistory(): void
}

/**
 * Create a saga orchestrator bound to an event bus.
 */
export function createSagaOrchestrator(bus: EventBus): SagaOrchestrator {
  const registered = new Map<string, SagaDefinition>()
  const history: SagaExecution[] = []

  function register<TContext extends Record<string, unknown>>(
    saga: SagaDefinition<TContext>,
  ): Unsubscribe {
    registered.set(saga.name, saga as unknown as SagaDefinition)

    const unsubscribe = bus.on(saga.triggerEvent, async (event: DomainEvent) => {
      const ctx: SagaContext<TContext> = {
        sagaId: crypto.randomUUID(),
        correlationId: event.metadata.correlationId,
        orgId: event.metadata.orgId,
        actorId: event.metadata.actorId,
        data: { ...event.payload } as TContext,
      }

      await execute(saga, ctx)
    })

    return () => {
      registered.delete(saga.name)
      unsubscribe()
    }
  }

  async function execute<TContext extends Record<string, unknown>>(
    saga: SagaDefinition<TContext>,
    ctx: SagaContext<TContext>,
  ): Promise<SagaExecution> {
    const execution: Mutable<SagaExecution> = {
      sagaId: ctx.sagaId,
      sagaName: saga.name,
      correlationId: ctx.correlationId,
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      status: 'running',
      stepsCompleted: [],
      stepsCompensated: [],
      error: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    }

    const completedSteps: SagaStep<TContext>[] = []

    for (const step of saga.steps) {
      const result = await safeExecuteStep(step, ctx)

      if (result.ok) {
        completedSteps.push(step)
        ;(execution.stepsCompleted as string[]).push(step.name)
      } else {
        // Step failed — begin compensation
        execution.status = 'compensating'
        execution.error = `Step "${step.name}" failed: ${result.error}`

        await compensate(completedSteps, ctx, execution)

        execution.status = execution.stepsCompensated.length === completedSteps.length
          ? 'compensated'
          : 'failed'
        execution.completedAt = new Date().toISOString()

        history.push(freeze(execution))
        return freeze(execution)
      }
    }

    // All steps succeeded
    execution.status = 'completed'
    execution.completedAt = new Date().toISOString()

    history.push(freeze(execution))
    return freeze(execution)
  }

  async function compensate<TContext extends Record<string, unknown>>(
    completedSteps: SagaStep<TContext>[],
    ctx: SagaContext<TContext>,
    execution: Mutable<SagaExecution>,
  ): Promise<void> {
    // Compensate in reverse order
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i]!
      const result = await safeCompensateStep(step, ctx)

      if (result.ok) {
        ;(execution.stepsCompensated as string[]).push(step.name)
      }
      // If compensation itself fails, we still continue compensating other steps
      // (best-effort compensation). The 'failed' status signals manual intervention needed.
    }
  }

  async function safeExecuteStep<TContext extends Record<string, unknown>>(
    step: SagaStep<TContext>,
    ctx: SagaContext<TContext>,
  ): Promise<SagaStepResult> {
    try {
      return await step.execute(ctx)
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  async function safeCompensateStep<TContext extends Record<string, unknown>>(
    step: SagaStep<TContext>,
    ctx: SagaContext<TContext>,
  ): Promise<SagaStepResult> {
    try {
      return await step.compensate(ctx)
    } catch {
      return { ok: false, error: `Compensation for "${step.name}" threw` }
    }
  }

  return {
    register,
    execute,
    registeredSagas: () => [...registered.keys()],
    executions: () => [...history],
    clearHistory: () => {
      history.length = 0
    },
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

/** Make all readonly properties mutable for internal building */
type Mutable<T> = { -readonly [K in keyof T]: T[K] }

/** Deep-freeze and return as readonly */
function freeze<T>(obj: Mutable<T>): T {
  return Object.freeze(obj) as T
}
