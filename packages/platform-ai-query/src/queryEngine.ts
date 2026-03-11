import { randomUUID } from 'node:crypto'
import type { NaturalLanguageQuery, QueryIntent, QueryResult, EvidenceReference } from './types'

const INTENT_KEYWORDS: Record<QueryIntent, string[]> = {
  status: ['status', 'health', 'running', 'up', 'down', 'active'],
  comparison: ['compare', 'versus', 'vs', 'difference', 'between'],
  trend: ['trend', 'over time', 'growth', 'decline', 'history'],
  anomaly: ['anomaly', 'spike', 'unusual', 'irregular', 'outlier'],
  compliance: ['compliant', 'compliance', 'policy', 'governance', 'audit'],
  unknown: [],
}

export function classifyIntent(query: string): QueryIntent {
  const lower = query.toLowerCase()
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'unknown') continue
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent as QueryIntent
    }
  }
  return 'unknown'
}

export function parseQuery(params: {
  query: string
  orgId: string
  actor: string
  context?: Record<string, unknown>
}): NaturalLanguageQuery {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  }
}

export function buildQueryResult(params: {
  queryId: string
  answer: string
  confidence: number
  evidenceRefs: EvidenceReference[]
}): QueryResult {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  }
}
