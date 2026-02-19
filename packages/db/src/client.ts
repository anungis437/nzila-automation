/**
 * Nzila OS — Drizzle Postgres client
 *
 * Reuse a single connection pool across the process.
 * DATABASE_URL comes from environment (evaluated lazily at runtime).
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    const sql = postgres(connectionString, { max: 10 })
    _db = drizzle(sql, { schema })
  }
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
export type Database = typeof db
