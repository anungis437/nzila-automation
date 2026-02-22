import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from '../../../schema-organizations';

export const publicContent = pgTable('public_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  body: text('body').notNull(),
  metadata: jsonb('metadata').default({}),
  tags: text('tags').array(),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('idx_public_content_slug').on(table.slug),
  publishedIdx: index('idx_public_content_published').on(table.isPublished, table.publishedAt),
}));

export type PublicContent = typeof publicContent.$inferSelect;
export type NewPublicContent = typeof publicContent.$inferInsert;
