/**
 * @nzila/platform-ai-query — barrel exports
 */

export type {
  NaturalLanguageQuery,
  QueryResult,
  EvidenceReference,
  QueryIntent,
} from './types'

export {
  naturalLanguageQuerySchema,
  queryResultSchema,
  evidenceReferenceSchema,
} from './types'

export { classifyIntent, parseQuery, buildQueryResult } from './queryEngine'
export { createEvidenceRef, validateEvidenceBacking } from './evidenceBacked'
