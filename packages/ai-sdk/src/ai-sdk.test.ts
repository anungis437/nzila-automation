import { describe, it, expect } from 'vitest'
import { createAiClient, AiSdkError } from './index'

describe('AiSdkError', () => {
  it('sets code, message and statusCode', () => {
    const err = new AiSdkError('budget_exceeded', 'over limit', 429)
    expect(err.code).toBe('budget_exceeded')
    expect(err.message).toBe('over limit')
    expect(err.statusCode).toBe(429)
    expect(err.name).toBe('AiSdkError')
  })

  it('defaults statusCode to 400', () => {
    const err = new AiSdkError('unknown', 'oops')
    expect(err.statusCode).toBe(400)
  })

  it('is an instance of Error', () => {
    const err = new AiSdkError('policy_denied', 'denied')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('createAiClient', () => {
  it('returns an object with expected methods', () => {
    const client = createAiClient({
      baseUrl: 'http://localhost:3001',
      getToken: () => 'test-token',
    })
    expect(client).toHaveProperty('generate')
    expect(client).toHaveProperty('chat')
    expect(client).toHaveProperty('embed')
    expect(client).toHaveProperty('extract')
    expect(typeof client.generate).toBe('function')
  })
})
