import { describe, it, expect, beforeEach } from 'vitest'
import { createDeadLetterQueue, type DeadLetterQueue } from './dead-letter-queue'
import type { ClassifiedFailure } from './failure-classification'

const TEST_FAILURE: ClassifiedFailure = {
  failureClass: 'transient',
  category: 'timeout',
  retryable: true,
  message: 'Request timed out',
  suggestedAction: 'Retry with increased timeout',
}

describe('DeadLetterQueue', () => {
  let dlq: DeadLetterQueue

  beforeEach(() => {
    dlq = createDeadLetterQueue()
  })

  it('starts empty', () => {
    expect(dlq.count()).toBe(0)
    expect(dlq.list()).toEqual([])
  })

  it('enqueues an entry', () => {
    const entry = dlq.enqueue({
      originId: 'cmd-1',
      originType: 'command',
      payload: { playbook: 'test' },
      failure: TEST_FAILURE,
      attemptCount: 3,
      source: 'orchestrator-api',
    })

    expect(entry.id).toBeDefined()
    expect(entry.originId).toBe('cmd-1')
    expect(entry.originType).toBe('command')
    expect(entry.enqueuedAt).toBeDefined()
    expect(dlq.count()).toBe(1)
  })

  it('retrieves by id', () => {
    const entry = dlq.enqueue({
      originId: 'cmd-1',
      originType: 'command',
      payload: {},
      failure: TEST_FAILURE,
      attemptCount: 1,
      source: 'test',
    })

    expect(dlq.get(entry.id)).toEqual(entry)
    expect(dlq.get('nonexistent')).toBeUndefined()
  })

  it('removes an entry', () => {
    const entry = dlq.enqueue({
      originId: 'evt-1',
      originType: 'event',
      payload: {},
      failure: TEST_FAILURE,
      attemptCount: 1,
      source: 'test',
    })

    expect(dlq.remove(entry.id)).toBe(true)
    expect(dlq.count()).toBe(0)
    expect(dlq.remove(entry.id)).toBe(false)
  })

  it('purges all entries', () => {
    dlq.enqueue({ originId: 'a', originType: 'job', payload: {}, failure: TEST_FAILURE, attemptCount: 1, source: 'test' })
    dlq.enqueue({ originId: 'b', originType: 'job', payload: {}, failure: TEST_FAILURE, attemptCount: 1, source: 'test' })
    dlq.enqueue({ originId: 'c', originType: 'event', payload: {}, failure: TEST_FAILURE, attemptCount: 1, source: 'test' })

    const purged = dlq.purge()
    expect(purged).toBe(3)
    expect(dlq.count()).toBe(0)
  })

  it('lists by origin type', () => {
    dlq.enqueue({ originId: 'a', originType: 'job', payload: {}, failure: TEST_FAILURE, attemptCount: 1, source: 'test' })
    dlq.enqueue({ originId: 'b', originType: 'event', payload: {}, failure: TEST_FAILURE, attemptCount: 1, source: 'test' })
    dlq.enqueue({ originId: 'c', originType: 'job', payload: {}, failure: TEST_FAILURE, attemptCount: 1, source: 'test' })

    const jobs = dlq.listByOriginType('job')
    expect(jobs).toHaveLength(2)

    const events = dlq.listByOriginType('event')
    expect(events).toHaveLength(1)
  })
})
