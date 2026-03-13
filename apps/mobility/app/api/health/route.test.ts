import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const response = GET()
    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.app).toBe('mobility')
    expect(body.timestamp).toBeDefined()
  })

  it('returns valid ISO timestamp', async () => {
    const response = GET()
    const body = await response.json()
    const parsed = new Date(body.timestamp)
    expect(parsed.getTime()).not.toBeNaN()
  })

  it('returns 200 status', async () => {
    const response = GET()
    expect(response.status).toBe(200)
  })
})
