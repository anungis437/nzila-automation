import { defineProject } from "vitest/config";
import path from "node:path";

export default defineProject({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    name: "union-eyes",
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      // Services tests are integration tests requiring a running database and
      // service-level dependencies (express, supertest).  They run via:
      //   pnpm -C apps/union-eyes test:services
      "services/**",
      "e2e/**",
    ],
  },
});
