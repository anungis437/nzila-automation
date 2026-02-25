import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'zonga',
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
  },
});
