import { defineConfig } from "vitest/config";

/**
 * Unit tests for the pure game engine. Anything that needs a browser is a
 * Playwright test instead.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
