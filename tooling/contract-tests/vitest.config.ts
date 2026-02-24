import { defineProject } from 'vitest/config'
import { join } from 'node:path'

export default defineProject({
  test: {
    name: 'contract-tests',
    environment: 'node',
    globals: false,
    testTimeout: 30_000, // Contract tests scan the full file tree — need headroom under parallel load
    include: ['**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/services/financial-service/**', // Uses Jest, not vitest
    ],
  },
  resolve: {
    alias: {
      // Allow contract tests to import from the monorepo root
      '@repo-root': join(__dirname, '..', '..'),
    },
  },
})
