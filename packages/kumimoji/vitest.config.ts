import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The word lists are read from disk where there is no browser; the tests that deal and check games need them.
    setupFiles: ["./src/words.ts"],
    testTimeout: 60_000,
  },
});
