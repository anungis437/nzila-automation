/**
 * Platform OS Observability Integration
 *
 * Provides pre-configured observability hooks for all platform OS packages.
 * Uses @nzila/platform-observability primitives (metrics, tracing, health checks).
 */

import {
  Counter,
  Histogram,
  globalRegistry,
  createLogger,
  trace,
  type TraceContext,
} from '@nzila/platform-observability'

// ── Metrics ────────────────────────────────────────────────────────────────────

/** Entity graph operations counter */
export const entityGraphOps = new Counter(
  'platform_entity_graph_operations_total',
  'Total entity graph operations',
  ['operation', 'entity_type'],
)

/** Event fabric events published */
export const eventFabricPublished = new Counter(
  'platform_event_fabric_published_total',
  'Total events published via the event fabric',
  ['event_type'],
)

/** Decision graph decisions created */
export const decisionGraphCreated = new Counter(
  'platform_decision_graph_decisions_total',
  'Total decisions created',
  ['decision_type', 'actor_type'],
)

/** AI run executions */
export const aiRunExecutions = new Counter(
  'platform_governed_ai_runs_total',
  'Total governed AI runs',
  ['operation_type', 'status'],
)

/** Reasoning chain executions */
export const reasoningChainExecutions = new Counter(
  'platform_reasoning_chains_total',
  'Total reasoning chain executions',
  ['reasoning_type', 'status'],
)

/** Data fabric sync jobs */
export const dataFabricSyncJobs = new Counter(
  'platform_data_fabric_sync_jobs_total',
  'Total data fabric sync jobs',
  ['source_system', 'status'],
)

/** Search query latency */
export const searchLatency = new Histogram(
  'platform_semantic_search_query_duration_ms',
  'Semantic search query duration in milliseconds',
  ['search_mode'],
)

/** AI run latency */
export const aiRunLatency = new Histogram(
  'platform_governed_ai_run_duration_ms',
  'Governed AI run duration in milliseconds',
  ['operation_type'],
)

/** Reasoning chain latency */
export const reasoningChainLatency = new Histogram(
  'platform_reasoning_chain_duration_ms',
  'Reasoning chain duration in milliseconds',
  ['reasoning_type'],
)

// ── Loggers ────────────────────────────────────────────────────────────────────

export const ontologyLogger = createLogger({ component: 'platform-ontology' })
export const entityGraphLogger = createLogger({ component: 'platform-entity-graph' })
export const eventFabricLogger = createLogger({ component: 'platform-event-fabric' })
export const knowledgeRegistryLogger = createLogger({ component: 'platform-knowledge-registry' })
export const dataFabricLogger = createLogger({ component: 'platform-data-fabric' })
export const decisionGraphLogger = createLogger({ component: 'platform-decision-graph' })
export const contextOrchestratorLogger = createLogger({ component: 'platform-context-orchestrator' })
export const semanticSearchLogger = createLogger({ component: 'platform-semantic-search' })
export const governedAILogger = createLogger({ component: 'platform-governed-ai' })
export const reasoningEngineLogger = createLogger({ component: 'platform-reasoning-engine' })

// ── Trace helpers ──────────────────────────────────────────────────────────────

/**
 * Wrap a platform operation with tracing.
 * Records span duration and logs errors automatically.
 */
export async function tracePlatformOp<T>(
  name: string,
  component: string,
  parent: TraceContext | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const span = trace(name, parent)
  try {
    const result = await fn()
    span.end()
    return result
  } catch (error) {
    span.setError(error instanceof Error ? error : new Error(String(error)))
    span.end()
    throw error
  }
}
