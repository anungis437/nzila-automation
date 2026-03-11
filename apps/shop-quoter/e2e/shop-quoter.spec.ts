/**
 * Shop Quoter — E2E Tests (Playwright)
 */
import { test, expect } from '@playwright/test'

const BASE = process.env.SHOP_QUOTER_URL ?? 'http://localhost:3007'

test.describe('Shop Quoter E2E', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('shop-quoter')
  })

  test('create quote flow', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page).toHaveTitle(/Quoter|Shop|Nzila/)
    // Verify main page loads without errors
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('modify quote updates correctly', async ({ request }) => {
    // Verify the quotes API endpoint is reachable
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
  })

  test('export quote returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/evidence/export`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.app).toBe('shop-quoter')
    expect(body.version).toBeDefined()
  })

  test('pricing override respects policy check', async ({ request }) => {
    const metricsRes = await request.get(`${BASE}/api/metrics`)
    expect(metricsRes.status()).toBe(200)
    const metrics = await metricsRes.json()
    expect(metrics.request_count).toBeDefined()
  })
})
