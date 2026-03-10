/**
 * @nzila/platform-reasoning-engine — In-Memory Store
 */
import type { ReasoningChain, ReasoningStore } from './types'

export function createInMemoryReasoningStore(): ReasoningStore {
  const chains = new Map<string, ReasoningChain>()

  return {
    async persistChain(chain) {
      chains.set(chain.id, chain)
    },
    async getChain(id) {
      return chains.get(id)
    },
    async getChainsByEntity(entityType, entityId) {
      return Array.from(chains.values()).filter(
        (c) => c.entityType === entityType && c.entityId === entityId,
      )
    },
    async getChainsByTenant(tenantId, limit = 50) {
      return Array.from(chains.values())
        .filter((c) => c.tenantId === tenantId)
        .slice(0, limit)
    },
  }
}
