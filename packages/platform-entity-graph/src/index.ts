/**
 * @nzila/platform-entity-graph — Barrel Export
 */

// Types
export type {
  EntityNode,
  EntityEdge,
  EntitySubgraph,
  RelationshipPath,
  NeighborResult,
  EntityGraphStore,
} from './types'

// Traversal
export {
  getEntityNode,
  getEntityNeighbors,
  buildEntitySubgraph,
  resolveRelationshipPath,
} from './traversal'

// Memory Store (reference implementation)
export { createInMemoryGraphStore } from './memory-store'
