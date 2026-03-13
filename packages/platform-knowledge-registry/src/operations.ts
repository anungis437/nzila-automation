/**
 * @nzila/platform-knowledge-registry — Knowledge Operations
 *
 * Core API functions for knowledge asset management.
 */
import type {
  KnowledgeAsset,
  KnowledgeStore,
  CreateKnowledgeAssetInput,
  KnowledgeSearchQuery,
} from './types'

let idCounter = 0

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  idCounter++
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, '0')}`
}

/**
 * Register a new knowledge asset.
 */
export async function registerKnowledgeAsset(
  store: KnowledgeStore,
  input: CreateKnowledgeAssetInput,
): Promise<KnowledgeAsset> {
  const now = new Date().toISOString()
  const asset: KnowledgeAsset = {
    id: generateId(),
    tenantScope: input.tenantScope,
    domainScope: input.domainScope,
    title: input.title,
    knowledgeType: input.knowledgeType,
    source: input.source,
    version: 1,
    effectiveDate: input.effectiveDate,
    status: 'active',
    tags: input.tags ?? [],
    structuredPayload: input.structuredPayload ?? {},
    textPayload: input.textPayload ?? '',
    createdAt: now,
    updatedAt: now,
  }
  await store.register(asset)
  return asset
}

/**
 * Search knowledge assets.
 */
export async function searchKnowledgeAssets(
  store: KnowledgeStore,
  query: KnowledgeSearchQuery,
): Promise<readonly KnowledgeAsset[]> {
  return store.search(query)
}

/**
 * Get a specific version of a knowledge asset.
 */
export async function getKnowledgeAssetVersion(
  store: KnowledgeStore,
  assetId: string,
  version: number,
) {
  return store.getVersion(assetId, version)
}

/**
 * Resolve applicable knowledge assets for a given domain and tenant context.
 * Returns only active assets matching the scope and optionally filtered by tags.
 */
export async function resolveApplicableKnowledge(
  store: KnowledgeStore,
  tenantScope: string,
  domainScope: string,
  tags?: readonly string[],
): Promise<readonly KnowledgeAsset[]> {
  return store.search({
    tenantScope,
    domainScope,
    status: 'active',
    tags: tags as string[] | undefined,
  })
}
