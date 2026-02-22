/**
 * Analytics Domain
 * 
 * Reporting and analytics schemas.
 * 
 * This domain consolidates:
 * - analytics.ts
 * - analytics-reporting-schema.ts (593 lines)
 * - reports-schema.ts
 * 
 * Priority: 12
 * 
 * Duplicates to resolve:
 * - mlPredictions (merged from ml-predictions-schema)
 */

// Export all analytics-related schemas from consolidated domain location
export * from '../../analytics';
export * from './reporting';
export * from './reports';
