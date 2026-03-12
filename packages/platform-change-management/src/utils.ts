/**
 * @nzila/platform-change-management — Utilities
 *
 * Shared helpers for change ID generation, timestamp formatting, etc.
 *
 * @module @nzila/platform-change-management/utils
 */

/**
 * Generate a change ID in the format CHG-YYYY-NNNN.
 * Accepts an optional sequence number; defaults to random 4-digit.
 */
export function generateChangeId(sequence?: number): string {
  const year = new Date().getUTCFullYear()
  const seq = sequence ?? Math.floor(1000 + Math.random() * 9000)
  return `CHG-${year}-${String(seq).padStart(4, '0')}`
}

/** Return current time as ISO UTC string. */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Parse a change ID to extract year. Returns null if invalid. */
export function parseChangeId(id: string): { year: number; sequence: number } | null {
  const match = /^CHG-(\d{4})-(\d{4,})$/.exec(id)
  if (!match) return null
  return { year: parseInt(match[1], 10), sequence: parseInt(match[2], 10) }
}

/** Check if two time windows overlap. */
export function windowsOverlap(
  a: { start: string; end: string },
  b: { start: string; end: string },
): boolean {
  const aStart = new Date(a.start).getTime()
  const aEnd = new Date(a.end).getTime()
  const bStart = new Date(b.start).getTime()
  const bEnd = new Date(b.end).getTime()
  return aStart < bEnd && bStart < aEnd
}

/** Check if a timestamp is within a window. */
export function isWithinWindow(
  timestamp: string | Date,
  window: { start: string; end: string },
): boolean {
  const t = new Date(timestamp).getTime()
  return t >= new Date(window.start).getTime() && t <= new Date(window.end).getTime()
}
