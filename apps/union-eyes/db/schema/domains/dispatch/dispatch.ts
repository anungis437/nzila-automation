/**
 * Dispatch Automation Schema
 *
 * Dispatch-hall model: employers request workers, the system
 * auto-ranks eligible members and dispatches them according
 * to configurable org-scoped rules (seniority, availability,
 * skills match).
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  _text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const dispatchRequestStatusEnum = pgEnum("dispatch_request_status", [
  "open",
  "partially_filled",
  "filled",
  "cancelled",
  "expired",
]);

export const dispatchAssignmentStatusEnum = pgEnum(
  "dispatch_assignment_status",
  ["offered", "accepted", "declined", "confirmed", "completed", "no_show"],
);

export const dispatchRuleTypeEnum = pgEnum("dispatch_rule_type", [
  "seniority",
  "availability",
  "skills_match",
  "rotation",
  "geographic_proximity",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Employer request for workers.
 */
export const dispatchRequests = pgTable(
  "dispatch_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    employerId: uuid("employer_id").notNull(),
    jobTitle: varchar("job_title", { length: 255 }).notNull(),
    requiredSkills: jsonb("required_skills").$type<string[]>().default([]),
    requestedWorkers: integer("requested_workers").notNull().default(1),
    status: dispatchRequestStatusEnum("status").notNull().default("open"),
    requestedDate: timestamp("requested_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_dispatch_requests_org").on(table.orgId),
    index("idx_dispatch_requests_employer").on(table.employerId),
    index("idx_dispatch_requests_status").on(table.status),
    index("idx_dispatch_requests_date").on(table.requestedDate),
  ],
);

/**
 * Individual worker assignment against a dispatch request.
 */
export const dispatchAssignments = pgTable(
  "dispatch_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => dispatchRequests.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    status: dispatchAssignmentStatusEnum("status")
      .notNull()
      .default("offered"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_dispatch_assignments_request").on(table.requestId),
    index("idx_dispatch_assignments_member").on(table.memberId),
    index("idx_dispatch_assignments_status").on(table.status),
  ],
);

/**
 * Org-scoped dispatch rules that control worker prioritization.
 */
export const dispatchRules = pgTable(
  "dispatch_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    ruleType: dispatchRuleTypeEnum("rule_type").notNull(),
    ruleDefinition: jsonb("rule_definition")
      .$type<Record<string, unknown>>()
      .notNull(),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_dispatch_rules_org").on(table.orgId),
    index("idx_dispatch_rules_type").on(table.ruleType),
  ],
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type DispatchRequestStatus =
  (typeof dispatchRequestStatusEnum.enumValues)[number];
export type DispatchAssignmentStatus =
  (typeof dispatchAssignmentStatusEnum.enumValues)[number];
export type DispatchRuleType =
  (typeof dispatchRuleTypeEnum.enumValues)[number];

export type DispatchRequest = typeof dispatchRequests.$inferSelect;
export type DispatchRequestInsert = typeof dispatchRequests.$inferInsert;
export type DispatchAssignment = typeof dispatchAssignments.$inferSelect;
export type DispatchAssignmentInsert = typeof dispatchAssignments.$inferInsert;
export type DispatchRule = typeof dispatchRules.$inferSelect;
export type DispatchRuleInsert = typeof dispatchRules.$inferInsert;
