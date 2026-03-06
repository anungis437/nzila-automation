/**
 * Employer Risk Score Schema
 *
 * AI-generated risk assessments for employers based on aggregated
 * signals: grievance frequency, compliance alerts, dispatch issues,
 * arbitration history, and more.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  jsonb,
  text,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from '../../../schema-organizations';
import { employers } from '../compliance/employer-compliance';

// ============================================================================
// ENUMS
// ============================================================================

export const riskBandEnum = pgEnum('employer_risk_band', [
  'low',
  'moderate',
  'elevated',
  'high',
  'critical',
]);

// ============================================================================
// TABLE
// ============================================================================

export const employerRiskScores = pgTable('employer_risk_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  employerId: uuid('employer_id')
    .notNull()
    .references(() => employers.id, { onDelete: 'cascade' }),

  // Risk assessment
  overallScore: decimal('overall_score', { precision: 5, scale: 4 }).notNull(), // 0–1
  riskBand: riskBandEnum('risk_band').notNull(),
  trendDirection: varchar('trend_direction', { length: 15 }).notNull(), // improving | stable | worsening

  // Signal breakdown
  signalsJson: jsonb('signals_json').$type<Array<{
    signal: string;
    value: number;
    weight: number;
    description: string;
  }>>().notNull(),

  // Counts used for scoring
  grievanceCount30d: integer('grievance_count_30d').default(0),
  complianceAlertCount30d: integer('compliance_alert_count_30d').default(0),
  arbitrationCount12m: integer('arbitration_count_12m').default(0),

  // Explainability (mandatory)
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(),
  explanation: text('explanation').notNull(),

  // Model metadata
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  profileKey: varchar('profile_key', { length: 100 }).notNull(),
  auditRef: varchar('audit_ref', { length: 120 }),

  // Validity window
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('idx_employer_risk_scores_org').on(table.organizationId),
  employerIdx: index('idx_employer_risk_scores_employer').on(table.employerId),
  bandIdx: index('idx_employer_risk_scores_band').on(table.riskBand),
  scoreIdx: index('idx_employer_risk_scores_score').on(table.overallScore),
}));

// ============================================================================
// TYPES
// ============================================================================

export type EmployerRiskScore = typeof employerRiskScores.$inferSelect;
export type EmployerRiskScoreInsert = typeof employerRiskScores.$inferInsert;
