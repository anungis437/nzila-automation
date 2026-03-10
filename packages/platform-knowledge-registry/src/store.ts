/**
 * @nzila/platform-knowledge-registry — In-Memory Store
 *
 * Reference implementation for testing and development.
 */
import type {
  KnowledgeAsset,
  KnowledgeVersion,
  KnowledgeStore,
  KnowledgeSearchQuery,
  UpdateKnowledgeAssetInput,
} from './types'

export function createInMemoryKnowledgeStore(): KnowledgeStore {
  const assets = new Map<string, KnowledgeAsset>()
  const versions = new Map<string, KnowledgeVersion[]>()

  function matchesQuery(asset: KnowledgeAsset, query: KnowledgeSearchQuery): boolean {
    if (query.tenantScope && asset.tenantScope !== query.tenantScope) return false
    if (query.domainScope && asset.domainScope !== query.domainScope) return false
    if (query.knowledgeType && asset.knowledgeType !== query.knowledgeType) return false
    if (query.status && asset.status !== query.status) return false
    if (query.tags?.length) {
      const hasTag = query.tags.some((t) => asset.tags.includes(t))
      if (!hasTag) return false
    }
    if (query.query) {
      const q = query.query.toLowerCase()
      const inTitle = asset.title.toLowerCase().includes(q)
      const inText = asset.textPayload.toLowerCase().includes(q)
      if (!inTitle && !inText) return false
    }
    return true
  }

  return {
    async register(asset) {
      assets.set(asset.id, asset)
      versions.set(asset.id, [
        {
          id: `${asset.id}-v${asset.version}`,
          assetId: asset.id,
          version: asset.version,
          structuredPayload: asset.structuredPayload,
          textPayload: asset.textPayload,
          changedBy: 'system',
          changeReason: 'initial registration',
          createdAt: asset.createdAt,
        },
      ])
    },

    async get(id) {
      return assets.get(id)
    },

    async search(query) {
      return Array.from(assets.values()).filter((a) => matchesQuery(a, query))
    },

    async update(id, input) {
      const existing = assets.get(id)
      if (!existing) return undefined

      const now = new Date().toISOString()
      const newVersion = existing.version + 1

      const updated: KnowledgeAsset = {
        ...existing,
        title: input.title ?? existing.title,
        status: input.status ?? existing.status,
        effectiveDate: input.effectiveDate ?? existing.effectiveDate,
        tags: input.tags ?? existing.tags,
        structuredPayload: input.structuredPayload ?? existing.structuredPayload,
        textPayload: input.textPayload ?? existing.textPayload,
        version: newVersion,
        updatedAt: now,
      }

      assets.set(id, updated)

      const versionList = versions.get(id) ?? []
      versionList.push({
        id: `${id}-v${newVersion}`,
        assetId: id,
        version: newVersion,
        structuredPayload: updated.structuredPayload,
        textPayload: updated.textPayload,
        changedBy: input.changedBy,
        changeReason: input.changeReason,
        createdAt: now,
      })
      versions.set(id, versionList)

      return updated
    },

    async getVersion(assetId, version) {
      const versionList = versions.get(assetId)
      return versionList?.find((v) => v.version === version)
    },

    async listVersions(assetId) {
      return versions.get(assetId) ?? []
    },
  }
}
