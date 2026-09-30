import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The simulation plays hundreds of whole games; a slow CI runner needs more than the default five seconds for one.
    testTimeout: 60_000,
  },
});
