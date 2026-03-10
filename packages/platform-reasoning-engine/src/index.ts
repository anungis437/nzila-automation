/**
 * @nzila/platform-reasoning-engine
 *
 * Cross-vertical reasoning engine with citations and explainability.
 */

// Types & schemas
export {
  ReasoningTypes,
  ReasoningStatuses,
  ReasoningRequestSchema,
} from './types'
export type {
  ReasoningType,
  ReasoningStatus,
  Citation,
  ReasoningStep,
  ReasoningConclusion,
  ReasoningChain,
  CrossVerticalInsight,
  ReasoningStrategy,
  ReasoningStore,
  ReasoningRequest,
} from './types'

// Operations
export {
  executeReasoningChain,
  getReasoningChain,
  getReasoningHistory,
} from './operations'
export type { ExecuteReasoningOptions } from './operations'

// In-memory store
export { createInMemoryReasoningStore } from './memory-store'

// Drizzle schema
export { reasoningChains } from './schema'
