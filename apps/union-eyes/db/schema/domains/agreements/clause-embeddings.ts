/**
 * Clause Embeddings Schema
 *
 * Stores vector embeddings for CBA clauses to enable semantic
 * similarity search for the Contract Clause Intelligence feature.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { cbaClause } from "./clauses";

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Stores embedding vectors (as JSON text) keyed to a clause.
 * When pgvector is enabled the `embedding_vector` column can be
 * migrated to a native `vector` type for ANN index support.
 */
export const clauseEmbeddings = pgTable(
  "clause_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clauseId: uuid("clause_id")
      .notNull()
      .references(() => cbaClause.id, { onDelete: "cascade" }),
    embeddingVector: text("embedding_vector").notNull(), // JSON-encoded float[]
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_clause_embeddings_clause").on(table.clauseId),
  ],
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClauseEmbedding = typeof clauseEmbeddings.$inferSelect;
export type ClauseEmbeddingInsert = typeof clauseEmbeddings.$inferInsert;
