import { randomUUID } from 'node:crypto'
import type { ModelRegistryEntry } from './types'

const registry: ModelRegistryEntry[] = []

export function registerModel(params: {
  name: string
  version: string
  provider: string
  capabilities: string[]
  riskLevel: 'low' | 'medium' | 'high'
}): ModelRegistryEntry {
  const entry: ModelRegistryEntry = {
    id: randomUUID(),
    ...params,
    approvedForProduction: false,
    registeredAt: new Date().toISOString(),
  }
  registry.push(entry)
  return entry
}

export function approveModel(modelId: string): ModelRegistryEntry | undefined {
  const entry = registry.find((m) => m.id === modelId)
  if (entry) {
    entry.approvedForProduction = true
    entry.lastAuditedAt = new Date().toISOString()
  }
  return entry
}

export function getModel(modelId: string): ModelRegistryEntry | undefined {
  return registry.find((m) => m.id === modelId)
}

export function listModels(filters?: {
  provider?: string
  approvedOnly?: boolean
}): ModelRegistryEntry[] {
  let results = [...registry]
  if (filters?.provider) results = results.filter((m) => m.provider === filters.provider)
  if (filters?.approvedOnly) results = results.filter((m) => m.approvedForProduction)
  return results
}

export function clearRegistry(): void {
  registry.length = 0
}
