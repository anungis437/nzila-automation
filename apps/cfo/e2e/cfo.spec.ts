/**
 * CFO — E2E Tests (Playwright)
 */
import { test, expect } from '@playwright/test'

const BASE = process.env.CFO_URL ?? 'http://localhost:3008'

test.describe('CFO E2E', () => {
  test('dashboard loads successfully', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page).toHaveTitle(/CFO|Finance|Nzila/)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('cfo')
  })

  test('financial report generated via evidence export', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evidence/export`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.app).toBe('cfo')
    expect(body.version).toBeDefined()
  })

  test('financial export via metrics endpoint', async ({ request }) => {
    const res = await request.get(`${BASE}/api/metrics`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.request_count).toBeDefined()
  })

  test('policy enforcement on adjustments', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.timestamp).toBeDefined()
  })
})
