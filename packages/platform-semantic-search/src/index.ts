/**
 * @nzila/platform-semantic-search
 *
 * Search across the platform — lexical, semantic, and hybrid modes with
 * ontology-aware filtering and graph-aware expansion.
 */

// Types & schemas
export {
  SearchModes,
  SearchQuerySchema,
  IndexDocumentSchema,
} from './types'
export type {
  SearchMode,
  SearchDocument,
  SearchQuery,
  SearchResult,
  SearchResponse,
  SearchIndex,
  EmbeddingProvider,
  IndexDocumentInput,
} from './types'

// Operations
export { indexEntity, searchEntities, removeEntityFromIndex } from './operations'

// In-memory index
export { createInMemorySearchIndex } from './memory-index'

// Drizzle schema
export { searchDocuments } from './schema'
