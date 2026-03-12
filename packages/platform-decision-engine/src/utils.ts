/**
 * @nzila/platform-decision-engine — Utility helpers
 *
 * @module @nzila/platform-decision-engine/utils
 */
import { createHash } from 'node:crypto'

let decisionCounter = 0

/**
 * Generate a decision ID: DEC-YYYY-NNNN
 */
export function generateDecisionId(): string {
  const year = new Date().getFullYear()
  decisionCounter += 1
  return `DEC-${year}-${String(decisionCounter).padStart(4, '0')}`
}

/**
 * Reset the counter (for testing).
 */
export function resetDecisionCounter(): void {
  decisionCounter = 0
}

/**
 * Current ISO UTC timestamp.
 */
export function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Compute a deterministic SHA-256 hash of stringified data.
 */
export function computeHash(data: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
}
