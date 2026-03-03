/**
 * Nzila OS — Platform Performance Envelope
 *
 * Request-level metrics tracking and percentile computation.
 * No secrets exposed. Org-scoped visibility with platform admin global view.
 *
 * @module @nzila/platform-performance
 */

export {
  trackRequestMetrics,
  getPerformanceEnvelope,
  getGlobalPerformanceEnvelope,
  type RequestMetric,
  type PerformanceEnvelope,
  type AppThroughput,
} from './metrics'

export {
  generateSyntheticLoad,
  executeScalePhase,
  runScaleEnvelope,
  DEFAULT_SCALE_PROFILES,
  DEFAULT_HARNESS_CONFIG,
  type ScaleProfile,
  type ScalePhaseResult,
  type ScaleEnvelopeResult,
  type ScaleHarnessConfig,
} from './scale-harness'

export {
  generateScaleReport,
  type ScaleReport,
  type ScaleReportSummary,
  type ScaleReportPhase,
} from './scale-report'
