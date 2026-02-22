import { pgTable, text, timestamp, uuid, varchar, pgEnum, boolean } from "drizzle-orm/pg-core";
import { organizations } from "../schema-organizations";
import { users } from "./user-management-schema";

// Enums
export const memberCategoryEnum = pgEnum("member_category", [
  "full_member",
  "associate",
  "honorary",
  "retired",
]);

// Organization Members table
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Changed from varchar to text to match database
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  
  // Role & Status
  role: text("role").notNull(),
  status: text("status").notNull(),
  
  // Union Info
  membershipNumber: text("membership_number"),
  
  // Membership Details
  isPrimary: boolean("is_primary"),
  memberCategory: memberCategoryEnum("member_category"),
  exemptFromPerCapita: boolean("exempt_from_per_capita"),
  exemptionReason: text("exemption_reason"),
  exemptionApprovedBy: varchar("exemption_approved_by", { length: 255 }),
  exemptionApprovedAt: timestamp("exemption_approved_at", { withTimezone: true }),
  
  // Timestamps
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;
export type SelectOrganizationMember = typeof organizationMembers.$inferSelect;

