/**
 * @nzila/platform-utils — Time Utilities
 *
 * Deterministic ISO 8601 UTC timestamps for all platform outputs.
 * No milliseconds, always UTC, always standardized.
 *
 * @module @nzila/platform-utils/time
 */

/**
 * Return the current time as an ISO 8601 UTC string without milliseconds.
 *
 * @example
 *   nowISO() // "2026-02-20T14:22:11Z"
 */
export function nowISO(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Convert any Date or ISO string to standardized ISO 8601 UTC without milliseconds.
 */
export function toISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}
