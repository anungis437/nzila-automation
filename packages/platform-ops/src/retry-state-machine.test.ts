import { describe, it, expect, beforeEach } from 'vitest'
import { createRetryStateMachine, type RetryStateMachine } from './retry-state-machine'
import type { RetryConfig } from './workflow-registry'

const TEST_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  backoffMultiplier: 2,
  maxDelayMs: 1000,
}

describe('RetryStateMachine', () => {
  let machine: RetryStateMachine

  beforeEach(() => {
    machine = createRetryStateMachine(TEST_CONFIG)
  })

  it('starts with attempt 0', () => {
    const s = machine.state()
    expect(s.attemptNumber).toBe(0)
    expect(s.exhausted).toBe(false)
    expect(s.lastError).toBeNull()
  })

  it('returns retry on first failure', () => {
    const decision = machine.recordFailure('boom')
    expect(decision).toBe('retry')
    expect(machine.state().attemptNumber).toBe(1)
    expect(machine.state().lastError).toBe('boom')
  })

  it('returns exhaust after max attempts', () => {
    machine.recordFailure('err1')
    machine.recordFailure('err2')
    const decision = machine.recordFailure('err3')
    expect(decision).toBe('exhaust')
    expect(machine.state().exhausted).toBe(true)
  })

  it('computes exponential backoff delay', () => {
    machine.recordFailure('err1')
    const s1 = machine.state()
    expect(s1.nextDelayMs).toBe(100) // initialDelayMs * 2^0

    machine.recordFailure('err2')
    const s2 = machine.state()
    expect(s2.nextDelayMs).toBe(200) // initialDelayMs * 2^1
  })

  it('caps delay at maxDelayMs', () => {
    const config: RetryConfig = {
      maxAttempts: 10,
      initialDelayMs: 500,
      backoffMultiplier: 10,
      maxDelayMs: 2000,
    }
    const m = createRetryStateMachine(config)
    m.recordFailure('err1')
    m.recordFailure('err2')
    expect(m.state().nextDelayMs).toBeLessThanOrEqual(2000)
  })

  it('reset clears state', () => {
    machine.recordFailure('err1')
    machine.recordFailure('err2')
    machine.reset()

    const s = machine.state()
    expect(s.attemptNumber).toBe(0)
    expect(s.lastError).toBeNull()
    expect(s.exhausted).toBe(false)
  })

  it('recordSuccess sets lastAttemptAt', () => {
    machine.recordSuccess()
    expect(machine.state().lastAttemptAt).not.toBeNull()
  })
})
