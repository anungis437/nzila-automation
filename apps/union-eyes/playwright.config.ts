import { defineConfig, devices } from '@playwright/test';

/**
 * Union-Eyes Playwright E2E Configuration
 *
 * Run with: pnpm -C apps/union-eyes e2e
 * Debug with: pnpm -C apps/union-eyes e2e --headed
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start local dev server if not running in CI */
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          port: 3003,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
