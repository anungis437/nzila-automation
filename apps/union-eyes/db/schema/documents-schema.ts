/**
 * Documents Schema
 * Database schema for general document management with folder support
 */
import { pgTable, text, integer, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from '../schema-organizations';

// Document Folders Table
export const documentFolders = pgTable('document_folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  parentFolderId: uuid('parent_folder_id'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Documents Table
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => documentFolders.id),
  
  // File information
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  fileType: text('file_type').notNull(),
  mimeType: text('mime_type'),
  
  // Metadata
  description: text('description'),
  tags: text('tags').array(),
  category: text('category'),
  contentText: text('content_text'), // Extracted text content for search
  
  // Upload information
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  
  // Status and access
  isConfidential: boolean('is_confidential').default(false),
  accessLevel: text('access_level').default('standard'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  
  // Additional metadata
  metadata: jsonb('metadata').default({}),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentFolder = typeof documentFolders.$inferSelect;
export type NewDocumentFolder = typeof documentFolders.$inferInsert;

