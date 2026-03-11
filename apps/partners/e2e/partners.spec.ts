/**
 * Partners — E2E Tests (Playwright)
 */
import { test, expect } from '@playwright/test'

const BASE = process.env.PARTNERS_URL ?? 'http://localhost:3002'

test.describe('Partners E2E', () => {
  test('create partner via health check', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('partners')
  })

  test('upload contract — evidence export available', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evidence/export`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.app).toBe('partners')
  })

  test('view partner analytics via metrics', async ({ request }) => {
    const res = await request.get(`${BASE}/api/metrics`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.request_count).toBeDefined()
    expect(body.error_rate).toBeDefined()
  })
})
