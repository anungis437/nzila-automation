/**
 * Platform OS Observability Integration
 *
 * Provides pre-configured observability hooks for all platform OS packages.
 * Uses @nzila/platform-observability primitives (metrics, tracing, health checks).
 */

import {
  Counter,
  Histogram,
  _globalRegistry,
  createLogger,
  trace,
} from '@nzila/platform-observability'

// ── Metrics ────────────────────────────────────────────────────────────────────

/** Entity graph operations counter */
export const entityGraphOps = new Counter(
  'platform_entity_graph_operations_total',
  'Total entity graph operations',
)

/** Event fabric events published */
export const eventFabricPublished = new Counter(
  'platform_event_fabric_published_total',
  'Total events published via the event fabric',
)

/** Decision graph decisions created */
export const decisionGraphCreated = new Counter(
  'platform_decision_graph_decisions_total',
  'Total decisions created',
)

/** AI run executions */
export const aiRunExecutions = new Counter(
  'platform_governed_ai_runs_total',
  'Total governed AI runs',
)

/** Reasoning chain executions */
export const reasoningChainExecutions = new Counter(
  'platform_reasoning_chains_total',
  'Total reasoning chain executions',
)

/** Data fabric sync jobs */
export const dataFabricSyncJobs = new Counter(
  'platform_data_fabric_sync_jobs_total',
  'Total data fabric sync jobs',
)

/** Search query latency */
export const searchLatency = new Histogram(
  'platform_semantic_search_query_duration_ms',
  'Semantic search query duration in milliseconds',
)

/** AI run latency */
export const aiRunLatency = new Histogram(
  'platform_governed_ai_run_duration_ms',
  'Governed AI run duration in milliseconds',
)

/** Reasoning chain latency */
export const reasoningChainLatency = new Histogram(
  'platform_reasoning_chain_duration_ms',
  'Reasoning chain duration in milliseconds',
)

// ── Loggers ────────────────────────────────────────────────────────────────────

export const ontologyLogger = createLogger()
export const entityGraphLogger = createLogger()
export const eventFabricLogger = createLogger()
export const knowledgeRegistryLogger = createLogger()
export const dataFabricLogger = createLogger()
export const decisionGraphLogger = createLogger()
export const contextOrchestratorLogger = createLogger()
export const semanticSearchLogger = createLogger()
export const governedAILogger = createLogger()
export const reasoningEngineLogger = createLogger()

// ── Trace helpers ──────────────────────────────────────────────────────────────

/**
 * Wrap a platform operation with tracing.
 * Records span duration and logs errors automatically.
 */
export async function tracePlatformOp<T>(
  name: string,
  component: string,
  _parent: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  const { result } = await trace(name, component, async () => fn())
  return result
}
