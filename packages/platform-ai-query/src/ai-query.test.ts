import { describe, it, expect, beforeEach } from 'vitest'
import { classifyIntent, parseQuery, buildQueryResult, executeQuery, getQueryLog, clearQueryLog } from '../src/queryEngine'
import { createEvidenceRef, validateEvidenceBacking } from '../src/evidenceBacked'

describe('platform-ai-query', () => {
  beforeEach(() => {
    clearQueryLog()
  })

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

    it('classifies trend intent for increase/decrease queries', () => {
      expect(classifyIntent('Why did grievances increase last month?')).toBe('trend')
    })

    it('classifies anomaly intent for risk queries', () => {
      expect(classifyIntent('Which employers are highest risk?')).toBe('anomaly')
    })

    it('classifies trend intent for change queries', () => {
      expect(classifyIntent('What changed in quote volume this week?')).toBe('trend')
    })

    it('classifies compliance intent', () => {
      expect(classifyIntent('What governance issues are currently open?')).toBe('compliance')
    })

    it('classifies anomaly for partner underperformance', () => {
      expect(classifyIntent('Which partners are highest risk?')).toBe('anomaly')
    })

    it('returns unknown for unclassifiable queries', () => {
      expect(classifyIntent('Hello world')).toBe('unknown')
    })

    it('parses query with unique ID', () => {
      const q = parseQuery({ query: 'Test', orgId: 'org-1', actor: 'admin' })
      expect(q.id).toBeTruthy()
      expect(q.query).toBe('Test')
    })

    it('parseQuery throws on empty orgId', () => {
      expect(() => parseQuery({ query: 'Test', orgId: '', actor: 'admin' })).toThrow('orgId is required')
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

    it('executeQuery logs query with output hash', () => {
      const result = executeQuery({
        query: 'Why did grievances increase last month?',
        orgId: 'org-1',
        actor: 'analyst',
      })
      expect(result.answer).toBeTruthy()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.evidenceRefs.length).toBeGreaterThan(0)

      const log = getQueryLog()
      expect(log.length).toBeGreaterThan(0)
      expect(log[log.length - 1].outputHash).toBeTruthy()
      expect(log[log.length - 1].orgId).toBe('org-1')
    })

    it('executeQuery requires org scope', () => {
      expect(() =>
        executeQuery({ query: 'test', orgId: '', actor: 'x' }),
      ).toThrow('orgId is required')
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
