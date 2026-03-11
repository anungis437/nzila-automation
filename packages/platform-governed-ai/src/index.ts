/**
 * @nzila/platform-governed-ai
 *
 * Governed AI operations — policy-checked, evidence-grounded, fully audited.
 */

// Types & schemas
export {
  AIOperationTypes,
  AIRunStatuses,
  AIRunRequestSchema,
} from './types'
export type {
  AIOperationType,
  AIRunStatus,
  EvidenceItem,
  PolicyConstraint,
  AIRunRecord,
  AIModelProvider,
  AIRunStore,
  PolicyEvaluator,
  AIRunRequest,
} from './types'

// Operations
export {
  executeGovernedAIRun,
  getAIRunHistory,
  getAIRun,
} from './operations'
export type { ExecuteAIRunOptions } from './operations'

// In-memory store & null evaluator
export {
  createInMemoryAIRunStore,
  createNullPolicyEvaluator,
} from './memory-store'

// Drizzle schema
export { aiRunRecords } from './schema'

// Instrumented operations
export { executeInstrumentedAIRun } from './instrumented-operations'
