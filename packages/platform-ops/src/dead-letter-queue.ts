/**
 * @nzila/platform-ops — Dead Letter Queue
 *
 * In-process dead-letter queue for events/jobs that have exhausted retries.
 * Provides inspection, replay, and purge operations.
 */
import type { ClassifiedFailure } from './failure-classification'

// ── DLQ Entry ───────────────────────────────────────────────────────────────

export interface DeadLetterEntry {
  readonly id: string
  readonly originId: string
  readonly originType: 'event' | 'job' | 'command' | 'integration'
  readonly payload: Record<string, unknown>
  readonly failure: ClassifiedFailure
  readonly attemptCount: number
  readonly enqueuedAt: string
  readonly source: string
}

// ── DLQ Interface ───────────────────────────────────────────────────────────

export interface DeadLetterQueue {
  enqueue(entry: Omit<DeadLetterEntry, 'id' | 'enqueuedAt'>): DeadLetterEntry
  list(): readonly DeadLetterEntry[]
  get(id: string): DeadLetterEntry | undefined
  remove(id: string): boolean
  purge(): number
  count(): number
  listByOriginType(originType: DeadLetterEntry['originType']): readonly DeadLetterEntry[]
}

// ── In-Memory DLQ ───────────────────────────────────────────────────────────

let idCounter = 0
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  idCounter++
  return `dlq-${String(idCounter).padStart(8, '0')}`
}

export function createDeadLetterQueue(): DeadLetterQueue {
  const entries = new Map<string, DeadLetterEntry>()

  return {
    enqueue(input) {
      const entry: DeadLetterEntry = {
        ...input,
        id: generateId(),
        enqueuedAt: new Date().toISOString(),
      }
      entries.set(entry.id, entry)
      return entry
    },

    list() {
      return Array.from(entries.values())
    },

    get(id) {
      return entries.get(id)
    },

    remove(id) {
      return entries.delete(id)
    },

    purge() {
      const count = entries.size
      entries.clear()
      return count
    },

    count() {
      return entries.size
    },

    listByOriginType(originType) {
      return Array.from(entries.values()).filter((e) => e.originType === originType)
    },
  }
}
