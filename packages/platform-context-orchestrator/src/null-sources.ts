/**
 * @nzila/platform-context-orchestrator — Null Sources
 *
 * No-op implementations of context sources for testing and defaults.
 */
import type {
  ContextSources,
  ContextEntitySource,
  ContextGraphSource,
  ContextEventSource,
  ContextKnowledgeSource,
  ContextDecisionSource,
  ContextTenantSource,
} from './types'

export function createNullEntitySource(): ContextEntitySource {
  return {
    async getEntity() {
      return null
    },
  }
}

export function createNullGraphSource(): ContextGraphSource {
  return {
    async getNeighbors() {
      return { nodes: [], edges: [] }
    },
  }
}

export function createNullEventSource(): ContextEventSource {
  return {
    async getRecentEvents() {
      return []
    },
  }
}

export function createNullKnowledgeSource(): ContextKnowledgeSource {
  return {
    async getApplicable() {
      return []
    },
  }
}

export function createNullDecisionSource(): ContextDecisionSource {
  return {
    async getDecisions() {
      return []
    },
  }
}

export function createNullTenantSource(): ContextTenantSource {
  return {
    async getTenantPolicies() {
      return {}
    },
  }
}

export function createNullContextSources(): ContextSources {
  return {
    entity: createNullEntitySource(),
    graph: createNullGraphSource(),
    events: createNullEventSource(),
    knowledge: createNullKnowledgeSource(),
    decisions: createNullDecisionSource(),
    tenant: createNullTenantSource(),
  }
}
