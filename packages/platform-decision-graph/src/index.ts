/**
 * @nzila/platform-decision-graph
 *
 * Explainable decision trail system — every platform decision is a node
 * in an auditable, traversable graph.
 */

// Types & schemas
export {
  DecisionTypes,
  DecisionStatuses,
  ActorTypes,
  DecisionEdgeTypes,
  CreateDecisionNodeSchema,
  CreateDecisionEdgeSchema,
} from './types'
export type {
  DecisionType,
  DecisionStatus,
  ActorType,
  DecisionEdgeType,
  DecisionNode,
  DecisionEdge,
  DecisionTrail,
  DecisionGraphStore,
  CreateDecisionNodeInput,
  CreateDecisionEdgeInput,
} from './types'

// Operations
export {
  createDecisionNode,
  linkDecisions,
  executeDecision,
  overrideDecision,
  getDecisionTrail,
  getDecisionsForEntity,
} from './operations'

// In-memory store
export { createInMemoryDecisionStore } from './memory-store'

// Drizzle schema
export { decisionNodes, decisionEdges } from './schema'
