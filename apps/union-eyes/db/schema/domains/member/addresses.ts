import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { organizations } from '../../../schema-organizations';

export const memberAddresses = pgTable('member_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  addressType: varchar('address_type', { length: 20 }).notNull().default('mailing'),
  streetAddress: text('street_address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  province: varchar('province', { length: 2 }).notNull(),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  country: varchar('country', { length: 2 }).notNull().default('CA'),
  isPrimary: boolean('is_primary').default(false),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type MemberAddress = typeof memberAddresses.$inferSelect;
export type NewMemberAddress = typeof memberAddresses.$inferInsert;
