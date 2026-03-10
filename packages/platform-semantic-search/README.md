# @nzila/platform-semantic-search

Search across the NzilaOS platform — lexical, semantic, and hybrid modes with ontology-aware filtering and graph-aware expansion.

## Purpose

Provides a unified search layer across all platform entities. Supports three modes:

- **Lexical** — token-matching (TF-IDF-like scoring with title boost)
- **Semantic** — embedding-based cosine similarity
- **Hybrid** — weighted combination of lexical (40%) and semantic (60%)

All queries are tenant-isolated. Results can be filtered by entity type and tags.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Search Document** | Indexed representation of a platform entity |
| **Search Index** | Storage + retrieval interface (in-memory reference, pg_tsvector+pgvector in production) |
| **Embedding Provider** | Interface for generating vector embeddings |
| **Graph Expansion** | Expand results to include graph neighbors (future) |

## Usage

```typescript
import {
  createInMemorySearchIndex,
  indexEntity,
  searchEntities,
  SearchModes,
} from '@nzila/platform-semantic-search'

const idx = createInMemorySearchIndex()

// Index entities
await indexEntity(idx, {
  tenantId: 'tenant-uuid',
  entityType: 'client',
  entityId: 'client-uuid',
  title: 'Ada Lovelace',
  content: 'First computer programmer',
  tags: ['vip'],
})

// Search
const response = await searchEntities(idx, {
  tenantId: 'tenant-uuid',
  query: 'programmer',
  mode: SearchModes.LEXICAL,
  limit: 10,
})
// response.results[0].document, response.results[0].score
```

## Drizzle Schema

Exports table: `searchDocuments`. Production deployments should add a pgvector column for embeddings.
