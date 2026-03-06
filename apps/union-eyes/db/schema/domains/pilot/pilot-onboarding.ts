/**
 * Pilot Onboarding Schema
 *
 * Tracks checklist item completion per organization during
 * the CAPE-CLC pilot onboarding flow.
 */

import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const pilotChecklistItems = pgTable(
  "pilot_checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    itemId: varchar("item_id", { length: 100 }).notNull(),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: varchar("completed_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_pilot_checklist_org_item").on(
      table.organizationId,
      table.itemId,
    ),
    index("idx_pilot_checklist_org").on(table.organizationId),
  ],
);
