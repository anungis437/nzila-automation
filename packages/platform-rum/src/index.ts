/**
 * @nzila/platform-rum — barrel exports
 *
 * Real User Monitoring with Web Vitals collection and OTel export.
 */

// Types
export type { WebVitalMetric, RUMEvent, RUMReporterOptions, WebVitalName } from './types.js';
export { WebVitalMetricSchema, RUMEventSchema, WEB_VITAL_THRESHOLDS } from './types.js';

// Client-side Web Vitals collection
export { initWebVitals, flushWebVitals } from './web-vitals.js';

// Server-side reporter
export { processRUMBatch, handleRUMBeacon, isRUMHealthy } from './reporter.js';
export type { RUMSummary } from './reporter.js';
