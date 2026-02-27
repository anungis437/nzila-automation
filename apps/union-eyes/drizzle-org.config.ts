import { defineConfig } from 'drizzle-kit'

/**
 * Temporary config to push the union-eyes organization tables
 * to the staging database. Used by the CAPE-ACEP seed workflow.
 */
export default defineConfig({
  schema: './db/schema-organizations.ts',
  out: './drizzle-org',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
