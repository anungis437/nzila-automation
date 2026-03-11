import { describe, it, expect } from 'vitest'
import { classifyIntent, parseQuery, buildQueryResult } from '../src/queryEngine'
import { createEvidenceRef, validateEvidenceBacking } from '../src/evidenceBacked'

describe('platform-ai-query', () => {
  describe('queryEngine', () => {
    it('classifies status intent', () => {
      expect(classifyIntent('What is the health status of shop-quoter?')).toBe('status')
    })

    it('classifies comparison intent', () => {
      expect(classifyIntent('Compare revenue between Q3 and Q4')).toBe('comparison')
    })

    it('classifies anomaly intent', () => {
      expect(classifyIntent('Are there any unusual spikes in error rates?')).toBe('anomaly')
    })

    it('returns unknown for unclassifiable queries', () => {
      expect(classifyIntent('Hello world')).toBe('unknown')
    })

    it('parses query with unique ID', () => {
      const q = parseQuery({ query: 'Test', orgId: 'org-1', actor: 'admin' })
      expect(q.id).toBeTruthy()
      expect(q.query).toBe('Test')
    })

    it('builds query result', () => {
      const result = buildQueryResult({
        queryId: '123',
        answer: 'All systems operational',
        confidence: 0.95,
        evidenceRefs: [],
      })
      expect(result.id).toBeTruthy()
      expect(result.answer).toBe('All systems operational')
    })
  })

  describe('evidenceBacked', () => {
    it('validates evidence with sufficient coverage', () => {
      const refs = [
        createEvidenceRef({ source: 'a', type: 'event', id: '1', summary: 's' }),
        createEvidenceRef({ source: 'b', type: 'metric', id: '2', summary: 's' }),
      ]
      const result = validateEvidenceBacking(refs)
      expect(result.valid).toBe(true)
      expect(result.coverage).toBe(0.5)
    })

    it('invalidates evidence with insufficient coverage', () => {
      const refs = [
        createEvidenceRef({ source: 'a', type: 'event', id: '1', summary: 's' }),
      ]
      const result = validateEvidenceBacking(refs)
      expect(result.valid).toBe(false)
      expect(result.coverage).toBe(0.25)
    })

    it('handles empty evidence', () => {
      const result = validateEvidenceBacking([])
      expect(result.valid).toBe(false)
      expect(result.coverage).toBe(0)
    })
  })
})
