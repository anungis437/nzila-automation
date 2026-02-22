/**
 * Feature Flags Schema
 * 
 * Runtime feature toggles for gradual rollouts, A/B testing, and kill switches.
 */

import { pgTable, text, boolean, integer, json, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Flag identification
  name: text("name").notNull().unique(),
  type: text("type").notNull().default('boolean'), // 'boolean' | 'percentage' | 'organization' | 'user'
  
  // Configuration
  enabled: boolean("enabled").notNull().default(false),
  percentage: integer("percentage"), // For percentage-based rollouts (0-100)
  allowedOrganizations: json("allowed_organizations").$type<string[]>(), // For organization-specific flags
  allowedUsers: json("allowed_users").$type<string[]>(), // For user-specific flags
  
  // Metadata
  description: text("description"),
  tags: json("tags").$type<string[]>().default([]),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: text("created_by"),
  lastModifiedBy: text("last_modified_by"),
});

// Zod schemas for validation
export const insertFeatureFlagSchema = createInsertSchema(featureFlags);
export const selectFeatureFlagSchema = createSelectSchema(featureFlags);

// Types
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

