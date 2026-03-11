/**
 * @nzila/platform-intelligence — barrel exports
 */

export type {
  AggregatedEvent,
  InsightSeverity,
  InsightCategory,
  CrossAppInsight,
  SignalType,
  OperationalSignal,
} from './types'

export {
  aggregatedEventSchema,
  crossAppInsightSchema,
  operationalSignalSchema,
} from './types'

export { aggregateEvent, getAggregatedEvents, clearEventStore } from './aggregator'
export { generateCrossAppInsights, crossAppInsights } from './insights'
export { detectOperationalSignals } from './signals'
