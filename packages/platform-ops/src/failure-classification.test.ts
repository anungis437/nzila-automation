import { describe, it, expect } from 'vitest'
import { classifyFailure, isRetryable } from './failure-classification'

describe('classifyFailure', () => {
  it('classifies rate limit errors as transient', () => {
    const result = classifyFailure({ message: 'Rate limit exceeded', statusCode: 429 })
    expect(result.failureClass).toBe('transient')
    expect(result.category).toBe('rate_limit')
    expect(result.retryable).toBe(true)
  })

  it('classifies timeout errors as transient', () => {
    const result = classifyFailure({ message: 'Request timed out: ETIMEDOUT' })
    expect(result.failureClass).toBe('transient')
    expect(result.category).toBe('timeout')
    expect(result.retryable).toBe(true)
  })

  it('classifies network errors as transient', () => {
    const result = classifyFailure({ message: 'connect ECONNREFUSED 127.0.0.1:3000' })
    expect(result.failureClass).toBe('transient')
    expect(result.category).toBe('network')
    expect(result.retryable).toBe(true)
  })

  it('classifies 503 as transient provider error', () => {
    const result = classifyFailure({ message: 'Service Unavailable', statusCode: 503 })
    expect(result.failureClass).toBe('transient')
    expect(result.category).toBe('provider_error')
    expect(result.retryable).toBe(true)
  })

  it('classifies auth errors as permanent', () => {
    const result = classifyFailure({ message: 'Unauthorized', statusCode: 401 })
    expect(result.failureClass).toBe('permanent')
    expect(result.category).toBe('auth')
    expect(result.retryable).toBe(false)
  })

  it('classifies validation errors as permanent', () => {
    const result = classifyFailure({ message: 'Validation failed: missing field', statusCode: 400 })
    expect(result.failureClass).toBe('permanent')
    expect(result.category).toBe('validation')
    expect(result.retryable).toBe(false)
  })

  it('classifies 404 as permanent not found', () => {
    const result = classifyFailure({ message: 'Resource not found', statusCode: 404 })
    expect(result.failureClass).toBe('permanent')
    expect(result.category).toBe('resource_not_found')
    expect(result.retryable).toBe(false)
  })

  it('classifies quota errors as permanent', () => {
    const result = classifyFailure({ message: 'Quota exceeded for this tenant' })
    expect(result.failureClass).toBe('permanent')
    expect(result.category).toBe('quota_exceeded')
    expect(result.retryable).toBe(false)
  })

  it('classifies config errors as permanent', () => {
    const result = classifyFailure({ message: 'Missing ENV variable — not configured' })
    expect(result.failureClass).toBe('permanent')
    expect(result.category).toBe('configuration')
    expect(result.retryable).toBe(false)
  })

  it('classifies unknown errors as unknown', () => {
    const result = classifyFailure({ message: 'Something completely unexpected happened' })
    expect(result.failureClass).toBe('unknown')
    expect(result.category).toBe('unknown')
    expect(result.retryable).toBe(false)
  })
})

describe('isRetryable', () => {
  it('returns true for transient errors', () => {
    expect(isRetryable({ message: 'ECONNRESET' })).toBe(true)
  })

  it('returns false for permanent errors', () => {
    expect(isRetryable({ message: 'Unauthorized', statusCode: 401 })).toBe(false)
  })
})
