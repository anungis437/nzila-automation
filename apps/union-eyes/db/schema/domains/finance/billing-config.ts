import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from '../../../schema-organizations';

export const organizationBillingConfig = pgTable('organization_billing_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  billingFrequency: varchar('billing_frequency', { length: 20 }).notNull().default('monthly'),
  billingDayOfMonth: integer('billing_day_of_month'),
  timezone: varchar('timezone', { length: 50 }).default('America/Toronto'),
  enabled: boolean('enabled').default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_org_billing_config_org').on(table.organizationId),
}));

export type OrganizationBillingConfig = typeof organizationBillingConfig.$inferSelect;
export type NewOrganizationBillingConfig = typeof organizationBillingConfig.$inferInsert;
