/**
 * @nzila/platform-semantic-search — In-Memory Search Index
 *
 * Reference implementation using TF-IDF-like lexical scoring and cosine
 * similarity for semantic search. Production implementations should use
 * PostgreSQL pg_tsvector + pgvector or a dedicated search engine.
 */
import type {
  SearchDocument,
  SearchIndex,
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchMode,
} from './types'

// ── Cosine Similarity ───────────────────────────────────────────────────────

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dotProduct / denom
}

// ── Lexical Score ───────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function lexicalScore(query: string, doc: SearchDocument): number {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return 0

  const docText = `${doc.title} ${doc.content}`.toLowerCase()
  const docTokens = new Set(tokenize(docText))

  let matches = 0
  for (const qt of queryTokens) {
    if (docTokens.has(qt)) matches++
  }

  // Title boost
  const titleTokens = new Set(tokenize(doc.title))
  let titleMatches = 0
  for (const qt of queryTokens) {
    if (titleTokens.has(qt)) titleMatches++
  }

  return (matches / queryTokens.length) * 0.7 + (titleMatches / queryTokens.length) * 0.3
}

// ── In-Memory Search Index ──────────────────────────────────────────────────

export function createInMemorySearchIndex(): SearchIndex {
  const documents = new Map<string, SearchDocument>()

  return {
    async indexDocument(doc) {
      documents.set(doc.id, doc)
    },

    async removeDocument(id) {
      documents.delete(id)
    },

    async getDocument(id) {
      return documents.get(id)
    },

    async reindexAll(tenantId) {
      // In-memory index doesn't need reindex — just return count
      let count = 0
      for (const doc of documents.values()) {
        if (doc.tenantId === tenantId) count++
      }
      return count
    },

    async search(query: SearchQuery): Promise<SearchResponse> {
      const start = performance.now()
      const { tenantId, mode, limit = 20, offset = 0 } = query
      const results: SearchResult[] = []

      for (const doc of documents.values()) {
        // Tenant isolation
        if (doc.tenantId !== tenantId) continue

        // Entity type filter
        if (
          query.entityTypes &&
          query.entityTypes.length > 0 &&
          !query.entityTypes.includes(doc.entityType)
        ) {
          continue
        }

        // Tag filter
        if (query.tags && query.tags.length > 0) {
          const hasTag = query.tags.some((t) => doc.tags.includes(t))
          if (!hasTag) continue
        }

        let score = 0
        let matchType: SearchMode = mode

        if (mode === 'lexical' || mode === 'hybrid') {
          score = lexicalScore(query.query, doc)
        }

        if (
          (mode === 'semantic' || mode === 'hybrid') &&
          query.embedding &&
          doc.embedding
        ) {
          const semantic = cosineSimilarity(query.embedding, doc.embedding)
          if (mode === 'hybrid') {
            score = score * 0.4 + semantic * 0.6
            matchType = 'hybrid'
          } else {
            score = semantic
            matchType = 'semantic'
          }
        }

        if (score > 0) {
          results.push({ document: doc, score, matchType })
        }
      }

      // Sort by score descending
      results.sort((a, b) => b.score - a.score)

      const paged = results.slice(offset, offset + limit)
      const executionTimeMs = performance.now() - start

      return {
        query: query.query,
        mode,
        results: paged,
        totalCount: results.length,
        executionTimeMs,
      }
    },
  }
}
