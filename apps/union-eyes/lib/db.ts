/**
 * Database module re-exports
 * 
 * DEPRECATED: This file exists for backwards compatibility only.
 * All new code should import directly from '@/db' instead.
 * 
 * Example:
 *   ❌ import { db } from '@/lib/db';
 *   ✅ import { db } from '@/db';
 */
export * from '@/db';

// Re-export sql helper from drizzle-orm for convenience
export { sql } from 'drizzle-orm';

