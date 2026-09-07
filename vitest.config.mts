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
    // The full-game simulations play hundreds of games; a CI runner needs
    // longer than the five-second default for one of those files.
    testTimeout: 60_000,
  },
});
