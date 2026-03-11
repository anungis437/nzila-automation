/**
 * Orchestrator API — Platform Integration Hooks
 *
 * Wires platform-event-fabric and platform-governed-ai so that
 * command lifecycle events are observable and AI dispatch requests
 * are policy-gated.
 */
import {
  createPlatformEventBus,
  createInMemoryEventStore,
  buildPlatformEvent,
  type PlatformEventBus,
} from '@nzila/platform-event-fabric'
import {
  createInMemoryAIRunStore,
  createNullPolicyEvaluator,
  type AIRunStore,
  type PolicyEvaluator,
} from '@nzila/platform-governed-ai'
import { createLogger } from '@nzila/os-core'

const logger = createLogger('orchestrator-platform')

// ── Event Fabric ────────────────────────────────────────────────────────────

let eventBus: PlatformEventBus | null = null

export function getEventBus(): PlatformEventBus {
  if (!eventBus) {
    const store = createInMemoryEventStore()
    eventBus = createPlatformEventBus({ store })
    logger.info('Platform event bus initialized (in-memory store)')
  }
  return eventBus
}

/**
 * Emit a command lifecycle event to the platform event bus.
 */
export async function emitCommandEvent(
  eventType: string,
  payload: Record<string, unknown>,
  actorId: string,
  tenantId = 'system',
): Promise<void> {
  const bus = getEventBus()
  const event = buildPlatformEvent({
    type: eventType as Parameters<typeof buildPlatformEvent>[0]['type'],
    payload,
    actorId,
    tenantId,
    source: 'orchestrator-api',
  })
  await bus.publish(event)
  logger.info('Platform event emitted', { eventType, actorId })
}

// ── Governed AI ─────────────────────────────────────────────────────────────

let aiRunStore: AIRunStore | null = null
let policyEvaluator: PolicyEvaluator | null = null

export function getAIRunStore(): AIRunStore {
  if (!aiRunStore) {
    aiRunStore = createInMemoryAIRunStore()
    logger.info('Governed AI run store initialized (in-memory)')
  }
  return aiRunStore
}

export function getPolicyEvaluator(): PolicyEvaluator {
  if (!policyEvaluator) {
    policyEvaluator = createNullPolicyEvaluator()
    logger.info('Governed AI policy evaluator initialized (null/pass-through)')
  }
  return policyEvaluator
}
