import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "union-eyes",
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      "services/**",
    ],
  },
});
