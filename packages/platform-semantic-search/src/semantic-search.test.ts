import { describe, it, expect, beforeEach } from 'vitest'
import {
  SearchModes,
  createInMemorySearchIndex,
  indexEntity,
  searchEntities,
  removeEntityFromIndex,
} from './index'
import type { SearchIndex } from './index'
import { OntologyEntityTypes } from '@nzila/platform-ontology'

const TENANT = '00000000-0000-0000-0000-000000000001'

describe('platform-semantic-search', () => {
  let idx: SearchIndex

  beforeEach(() => {
    idx = createInMemorySearchIndex()
  })

  // ── Indexing ──────────────────────────────────────────────────────

  describe('indexEntity', () => {
    it('indexes a document and retrieves it', async () => {
      const doc = await indexEntity(idx, {
        tenantId: TENANT,
        entityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000010',
        title: 'Ada Lovelace',
        content: 'First computer programmer, daughter of Lord Byron',
        metadata: { source: 'hubspot' },
        tags: ['vip', 'tech'],
      })

      expect(doc.id).toBeDefined()
      expect(doc.title).toBe('Ada Lovelace')

      const retrieved = await idx.getDocument(doc.id)
      expect(retrieved).toEqual(doc)
    })
  })

  // ── Lexical Search ────────────────────────────────────────────────

  describe('lexical search', () => {
    beforeEach(async () => {
      await indexEntity(idx, {
        tenantId: TENANT,
        entityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000010',
        title: 'Ada Lovelace',
        content: 'First computer programmer, analytical engine expert',
        metadata: {},
        tags: ['tech'],
      })
      await indexEntity(idx, {
        tenantId: TENANT,
        entityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000011',
        title: 'Grace Hopper',
        content: 'Computer scientist, COBOL inventor, Navy admiral',
        metadata: {},
        tags: ['tech', 'military'],
      })
      await indexEntity(idx, {
        tenantId: TENANT,
        entityType: OntologyEntityTypes.DOCUMENT,
        entityId: '00000000-0000-0000-0000-000000000012',
        title: 'Annual Report 2024',
        content: 'Financial summary and outlook',
        metadata: {},
        tags: ['finance'],
      })
    })

    it('finds matching documents', async () => {
      const response = await searchEntities(idx, {
        tenantId: TENANT,
        query: 'computer programmer',
        mode: SearchModes.LEXICAL,
      })
      expect(response.results.length).toBeGreaterThan(0)
      expect(response.results[0].document.title).toBe('Ada Lovelace')
    })

    it('filters by entity type', async () => {
      const response = await searchEntities(idx, {
        tenantId: TENANT,
        query: 'computer',
        mode: SearchModes.LEXICAL,
        entityTypes: [OntologyEntityTypes.DOCUMENT],
      })
      expect(response.results).toHaveLength(0)
    })

    it('filters by tag', async () => {
      const response = await searchEntities(idx, {
        tenantId: TENANT,
        query: 'computer',
        mode: SearchModes.LEXICAL,
        tags: ['military'],
      })
      expect(response.results).toHaveLength(1)
      expect(response.results[0].document.title).toBe('Grace Hopper')
    })

    it('respects tenant isolation', async () => {
      const response = await searchEntities(idx, {
        tenantId: '00000000-0000-0000-0000-999999999999',
        query: 'computer',
        mode: SearchModes.LEXICAL,
      })
      expect(response.results).toHaveLength(0)
    })
  })

  // ── Semantic Search ───────────────────────────────────────────────

  describe('semantic search', () => {
    it('uses cosine similarity with embeddings', async () => {
      await indexEntity(
        idx,
        {
          tenantId: TENANT,
          entityType: OntologyEntityTypes.CLIENT,
          entityId: '00000000-0000-0000-0000-000000000010',
          title: 'Test Doc',
          content: 'Test content',
          metadata: {},
          tags: [],
        },
        [1, 0, 0],
      )

      const response = await searchEntities(idx, {
        tenantId: TENANT,
        query: 'test',
        mode: SearchModes.SEMANTIC,
        embedding: [1, 0, 0],
      })
      expect(response.results).toHaveLength(1)
      expect(response.results[0].score).toBeCloseTo(1.0)
    })
  })

  // ── Removal ───────────────────────────────────────────────────────

  describe('removeEntityFromIndex', () => {
    it('removes a document from the index', async () => {
      const doc = await indexEntity(idx, {
        tenantId: TENANT,
        entityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000010',
        title: 'To Remove',
        content: 'Will be removed',
        metadata: {},
        tags: [],
      })

      await removeEntityFromIndex(idx, doc.id)
      const retrieved = await idx.getDocument(doc.id)
      expect(retrieved).toBeUndefined()
    })
  })
})
