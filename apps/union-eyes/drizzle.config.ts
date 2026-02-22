/**
 * Drizzle ORM — Frontend Edge/Cache Schema Only
 *
 * ARCHITECTURE BOUNDARY (NzilaOS rule):
 *  - Drizzle manages ONLY the frontend edge/cache tables in the
 *    `ue_cache` namespace (e.g. union_structure_cache, session snapshots).
 *  - Django ORM manages the backend source-of-truth tables.
 *  - These two schema namespaces MUST NOT share table names.
 *  - Never add Django-owned tables (org, audit_logs, compliance.*) here.
 *  - See: docs/architecture/orm-boundary.md
 */
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema/union-structure-standalone.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
