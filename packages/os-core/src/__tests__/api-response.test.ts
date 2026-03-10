/**
 * @nzila/os-core — API Response Envelope Tests
 *
 * Validates ApiError constructors, envelope shapes, and Zod error conversion.
 */
import { describe, it, expect } from 'vitest'
import { ZodError, z } from 'zod'
import { ApiError, ApiErrorCode, apiSuccess, apiError } from '../api-response'

describe('ApiError', () => {
  it('badRequest sets 400 + VALIDATION_ERROR', () => {
    const err = ApiError.badRequest('invalid input', { field: 'name' })
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe(ApiErrorCode.VALIDATION_ERROR)
    expect(err.message).toBe('invalid input')
    expect(err.details).toEqual({ field: 'name' })
    expect(err).toBeInstanceOf(Error)
  })

  it('unauthorized sets 401', () => {
    const err = ApiError.unauthorized()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe(ApiErrorCode.UNAUTHORIZED)
  })

  it('forbidden sets 403', () => {
    const err = ApiError.forbidden()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe(ApiErrorCode.FORBIDDEN)
  })

  it('notFound sets 404', () => {
    const err = ApiError.notFound('Order not found')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Order not found')
  })

  it('conflict sets 409', () => {
    const err = ApiError.conflict('duplicate key')
    expect(err.statusCode).toBe(409)
    expect(err.code).toBe(ApiErrorCode.CONFLICT)
  })

  it('fromZodError converts ZodError to 400 with issue details', () => {
    const schema = z.object({ name: z.string(), age: z.number() })
    let zodErr: ZodError
    try {
      schema.parse({ name: 123, age: 'old' })
      throw new Error('should not reach')
    } catch (e) {
      zodErr = e as ZodError
    }
    const err = ApiError.fromZodError(zodErr)
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe(ApiErrorCode.VALIDATION_ERROR)
    expect(Array.isArray(err.details)).toBe(true)
    const details = err.details as Array<{ path: string; message: string }>
    expect(details.length).toBeGreaterThanOrEqual(2)
    expect(details.some(d => d.path === 'name')).toBe(true)
  })
})

describe('apiSuccess', () => {
  it('wraps data with meta', () => {
    const result = apiSuccess({ items: [1, 2, 3] }, 'req-123')
    expect(result.data).toEqual({ items: [1, 2, 3] })
    expect(result.meta.requestId).toBe('req-123')
    expect(result.meta.timestamp).toBeDefined()
  })

  it('defaults requestId to "unknown" when not provided', () => {
    const result = apiSuccess('hello')
    expect(result.meta.requestId).toBe('unknown')
  })
})

describe('apiError', () => {
  it('builds error envelope', () => {
    const result = apiError(ApiErrorCode.NOT_FOUND, 'gone', 'req-456')
    expect(result.error.code).toBe('NOT_FOUND')
    expect(result.error.message).toBe('gone')
    expect(result.meta.requestId).toBe('req-456')
  })

  it('includes details when provided', () => {
    const result = apiError('X', 'msg', 'req', { hint: 'check input' })
    expect(result.error.details).toEqual({ hint: 'check input' })
  })

  it('omits details when undefined', () => {
    const result = apiError('X', 'msg', 'req')
    expect(result.error).not.toHaveProperty('details')
  })
})
