/**
 * @nzila/platform-context-orchestrator
 *
 * Context envelope assembler — pulls from ontology, entity graph, event history,
 * knowledge registry, decision graph, and tenant policies into a single envelope.
 */

// Types
export { ContextPurposes, ContextRequestSchema } from './types'
export type {
  ContextPurpose,
  ContextEnvelope,
  ContextCaller,
  ContextRequest,
  ContextSources,
  ContextEntitySource,
  ContextGraphSource,
  ContextEventSource,
  ContextKnowledgeSource,
  ContextDecisionSource,
  ContextTenantSource,
} from './types'

// Assembler
export {
  buildContextEnvelope,
  getWorkflowContext,
  getDecisionContext,
  getAIContext,
} from './assembler'

// Null/test sources
export {
  createNullContextSources,
  createNullEntitySource,
  createNullGraphSource,
  createNullEventSource,
  createNullKnowledgeSource,
  createNullDecisionSource,
  createNullTenantSource,
} from './null-sources'
