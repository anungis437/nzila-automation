/**
 * Steward Management Schema
 *
 * Tracks steward profiles, specializations, regions, and
 * automated case assignments for the Steward Workflow Engine.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { grievances } from "../claims/grievances";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const stewardAssignmentStatusEnum = pgEnum(
  "steward_assignment_status",
  ["pending", "accepted", "active", "completed", "declined", "reassigned"],
);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Steward profiles linked to org users.
 * Tracks region, specialization, and availability for assignment.
 */
export const stewards = pgTable(
  "stewards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    userId: uuid("user_id").notNull(),
    region: varchar("region", { length: 255 }),
    specialization: varchar("specialization", { length: 255 }),
    active: boolean("active").notNull().default(true),
    maxCaseload: integer("max_caseload").notNull().default(10),
    currentCaseload: integer("current_caseload").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_stewards_org").on(table.orgId),
    index("idx_stewards_user").on(table.userId),
    index("idx_stewards_region").on(table.region),
    index("idx_stewards_specialization").on(table.specialization),
    index("idx_stewards_active").on(table.active),
  ],
);

/**
 * Tracks which steward is assigned to which grievance.
 */
export const stewardAssignments = pgTable(
  "steward_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    grievanceId: uuid("grievance_id")
      .notNull()
      .references(() => grievances.id, { onDelete: "cascade" }),
    stewardId: uuid("steward_id")
      .notNull()
      .references(() => stewards.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: stewardAssignmentStatusEnum("status").notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_steward_assignments_grievance").on(table.grievanceId),
    index("idx_steward_assignments_steward").on(table.stewardId),
    index("idx_steward_assignments_status").on(table.status),
  ],
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type StewardAssignmentStatus =
  (typeof stewardAssignmentStatusEnum.enumValues)[number];

export type Steward = typeof stewards.$inferSelect;
export type StewardInsert = typeof stewards.$inferInsert;
export type StewardAssignment = typeof stewardAssignments.$inferSelect;
export type StewardAssignmentInsert = typeof stewardAssignments.$inferInsert;
