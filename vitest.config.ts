import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      // Apps
      'apps/abr',
      'apps/console',
      'apps/orchestrator-api',
      'apps/partners',
      'apps/union-eyes',
      'apps/web',
      // Packages
      'packages/ai-core',
      'packages/ai-sdk',
      'packages/blob',
      'packages/db',
      'packages/ml-core',
      'packages/ml-sdk',
      'packages/os-core',
      'packages/payments-stripe',
      'packages/qbo',
      'packages/tax',
      'packages/tools-runtime',
      'packages/ui',
      // Contract tests (architectural invariants)
      'tooling/contract-tests',
    ],
  },
})
