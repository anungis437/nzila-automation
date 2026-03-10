/**
 * @nzila/platform-entity-graph — In-Memory Graph Store
 *
 * Reference implementation for testing and development.
 * Production usage should implement EntityGraphStore against a database.
 */
import type { OntologyEntityType } from '@nzila/platform-ontology'
import type { EntityNode, EntityEdge, EntityGraphStore } from './types'

export function createInMemoryGraphStore(): EntityGraphStore {
  const nodes = new Map<string, EntityNode>()
  const edges = new Map<string, EntityEdge>()

  const nodeKey = (tenantId: string, entityType: OntologyEntityType, entityId: string) =>
    `${tenantId}:${entityType}:${entityId}`

  return {
    async getNode(tenantId, entityType, entityId) {
      return nodes.get(nodeKey(tenantId, entityType, entityId))
    },

    async getEdges(tenantId, entityType, entityId) {
      return Array.from(edges.values()).filter(
        (e) =>
          (e.sourceEntityType === entityType && e.sourceEntityId === entityId) ||
          (e.targetEntityType === entityType && e.targetEntityId === entityId),
      )
    },

    async addNode(node) {
      nodes.set(nodeKey(node.tenantId, node.entityType, node.entityId), node)
    },

    async addEdge(edge) {
      edges.set(edge.id, edge)
    },

    async removeEdge(edgeId) {
      edges.delete(edgeId)
    },
  }
}
