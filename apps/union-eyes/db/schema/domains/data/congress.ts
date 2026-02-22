/**
 * Congress Memberships Schema
 *
 * Tracks organization memberships in congress-level federations.
 */

import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { organizations } from "../../../schema-organizations";

export const congressMembershipStatusEnum = pgEnum("congress_membership_status", [
  "active",
  "suspended",
  "expired",
  "pending",
]);

export const congressMemberships = pgTable(
  "congress_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references((): AnyPgColumn => organizations.id, { onDelete: "cascade" }),
    congressId: uuid("congress_id")
      .notNull()
      .references((): AnyPgColumn => organizations.id, { onDelete: "restrict" }),
    status: congressMembershipStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    idxCongressMembershipsOrgId: index("idx_congress_memberships_org_id").on(
      table.organizationId
    ),
    idxCongressMembershipsCongressId: index(
      "idx_congress_memberships_congress_id"
    ).on(table.congressId),
    idxCongressMembershipsStatus: index("idx_congress_memberships_status").on(
      table.status
    ),
    idxCongressMembershipsJoinedAt: index(
      "idx_congress_memberships_joined_at"
    ).on(table.joinedAt),
    congressMembershipsOrgCongressUnique: uniqueIndex(
      "congress_memberships_org_congress_unique"
    ).on(table.organizationId, table.congressId),
  })
);

