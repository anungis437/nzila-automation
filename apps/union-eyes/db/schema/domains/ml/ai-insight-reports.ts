/**
 * AI Insight Reports Schema
 *
 * Stores AI-generated executive insights: trend forecasts,
 * employer hotspot predictions, steward capacity projections,
 * and arbitration escalation predictions.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  jsonb,
  text,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from '../../../schema-organizations';

// ============================================================================
// ENUMS
// ============================================================================

export const insightReportTypeEnum = pgEnum('insight_report_type', [
  'trend_forecast',
  'employer_hotspots',
  'steward_capacity',
  'arbitration_escalation',
  'executive_summary',
]);

export const insightTimeframeEnum = pgEnum('insight_timeframe', [
  '30d',
  '60d',
  '90d',
  '6m',
  '12m',
]);

// ============================================================================
// TABLE
// ============================================================================

export const aiInsightReports = pgTable('ai_insight_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Report metadata
  reportType: insightReportTypeEnum('report_type').notNull(),
  timeframe: insightTimeframeEnum('timeframe').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  summary: text('summary').notNull(),

  // Structured insights
  insightsJson: jsonb('insights_json').$type<Array<{
    label: string;
    value: number | string;
    trend: 'up' | 'down' | 'stable';
    severity: 'info' | 'warning' | 'critical';
    description: string;
  }>>().notNull(),

  // Predictions (for forecasting reports)
  predictionsJson: jsonb('predictions_json').$type<Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    lowerBound: number;
    upperBound: number;
    horizon: string;
  }>>(),

  // Recommendations
  recommendationsJson: jsonb('recommendations_json').$type<Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    impact: string;
    effort: string;
  }>>(),

  // Explainability (mandatory)
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(),
  explanation: text('explanation').notNull(),
  dataSourcesUsed: jsonb('data_sources_used').$type<string[]>(),

  // Model metadata
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  profileKey: varchar('profile_key', { length: 100 }).notNull(),
  auditRef: varchar('audit_ref', { length: 120 }),

  // Validity
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('idx_ai_insight_reports_org').on(table.organizationId),
  typeIdx: index('idx_ai_insight_reports_type').on(table.reportType),
  timeframeIdx: index('idx_ai_insight_reports_timeframe').on(table.timeframe),
  generatedIdx: index('idx_ai_insight_reports_generated').on(table.generatedAt),
}));

// ============================================================================
// TYPES
// ============================================================================

export type AiInsightReport = typeof aiInsightReports.$inferSelect;
export type AiInsightReportInsert = typeof aiInsightReports.$inferInsert;
