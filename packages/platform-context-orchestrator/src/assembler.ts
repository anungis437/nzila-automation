/**
 * @nzila/platform-context-orchestrator — Assembler
 *
 * Builds a ContextEnvelope by pulling data from all platform sources in parallel.
 */
import type {
  ContextEnvelope,
  ContextSources,
  ContextRequest,
} from './types'
import type { OntologyEntityType } from '@nzila/platform-ontology'

// ── ID Generation ───────────────────────────────────────────────────────────

let idCounter = 0
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  idCounter++
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, '0')}`
}

// ── Build Context Envelope ──────────────────────────────────────────────────

/**
 * Assemble a full context envelope by querying all platform sources in parallel.
 */
export async function buildContextEnvelope(
  sources: ContextSources,
  request: ContextRequest,
): Promise<ContextEnvelope> {
  const {
    tenantId,
    purpose,
    entityType,
    entityId,
    caller,
    graphDepth = 1,
    eventLimit = 20,
    knowledgeTags = [],
  } = request

  const entityTypeStr = entityType as OntologyEntityType

  // Parallel fetch from all context sources
  const [entity, graphResult, events, knowledge, decisions, tenantPolicies] =
    await Promise.all([
      sources.entity.getEntity(tenantId, entityTypeStr, entityId),
      sources.graph.getNeighbors(entityTypeStr, entityId, graphDepth),
      sources.events.getRecentEvents(tenantId, entityTypeStr, entityId, eventLimit),
      sources.knowledge.getApplicable(tenantId, entityTypeStr, knowledgeTags),
      sources.decisions.getDecisions(entityTypeStr, entityId),
      sources.tenant.getTenantPolicies(tenantId),
    ])

  return {
    id: generateId(),
    tenantId,
    purpose: purpose as ContextEnvelope['purpose'],
    primaryEntityType: entityTypeStr,
    primaryEntityId: entityId,
    assembledAt: new Date().toISOString(),
    entity,
    relatedEntities: graphResult.nodes,
    relationships: graphResult.edges,
    recentEvents: events,
    applicableKnowledge: knowledge,
    decisionHistory: decisions,
    tenantPolicies,
    caller,
  }
}

// ── Convenience Builders ────────────────────────────────────────────────────

/**
 * Build context for a workflow step.
 */
export async function getWorkflowContext(
  sources: ContextSources,
  tenantId: string,
  entityType: OntologyEntityType,
  entityId: string,
  caller: ContextRequest['caller'],
): Promise<ContextEnvelope> {
  return buildContextEnvelope(sources, {
    tenantId,
    purpose: 'workflow',
    entityType,
    entityId,
    caller,
    graphDepth: 1,
    eventLimit: 10,
  })
}

/**
 * Build context for a decision — deeper graph, more events.
 */
export async function getDecisionContext(
  sources: ContextSources,
  tenantId: string,
  entityType: OntologyEntityType,
  entityId: string,
  caller: ContextRequest['caller'],
): Promise<ContextEnvelope> {
  return buildContextEnvelope(sources, {
    tenantId,
    purpose: 'decision',
    entityType,
    entityId,
    caller,
    graphDepth: 2,
    eventLimit: 50,
  })
}

/**
 * Build context for AI inference — maximum context.
 */
export async function getAIContext(
  sources: ContextSources,
  tenantId: string,
  entityType: OntologyEntityType,
  entityId: string,
  caller: ContextRequest['caller'],
  knowledgeTags?: readonly string[],
): Promise<ContextEnvelope> {
  return buildContextEnvelope(sources, {
    tenantId,
    purpose: 'ai_inference',
    entityType,
    entityId,
    caller,
    graphDepth: 3,
    eventLimit: 100,
    knowledgeTags,
  })
}
