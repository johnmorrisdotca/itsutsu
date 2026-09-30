import { defineConfig } from "vitest/config";

import { narabeDirect } from "./scripts/vitest/narabe-direct.mts";

/**
 * Unit tests for the pure game engine. Anything that needs a browser is a
 * Playwright test instead.
 */
export default defineConfig({
  // See scripts/vitest/narabe-direct.mts — a module that only re-exports the rules engine is skipped under test.
  plugins: [narabeDirect()],
  resolve: {
    tsconfigPaths: true,
    // See scripts/vitest/server-only.ts — the real package throws outside a
    // server bundle, which would block testing any server-side module.
    alias: { "server-only": new URL("./scripts/vitest/server-only.ts", import.meta.url).pathname },
  },
  test: {
    // scripts/ holds tooling tested beside its source — release-commit.test.ts
    // proves release:take commits what it writes. Nothing there needs a browser.
    // Every *.test.ts under either tree runs in test:unit, so a runner that
    // writes anything must guard itself, writing nothing unless asked, as
    // src/lib/bots/botSeries.play.test.ts does behind BOT_GAMES_RUN=1.
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
    // Gomoji's word lists are loaded when a puzzle needs them (`wordData.ts`); the tests that make and check puzzles directly have them loaded first.
    setupFiles: ["./scripts/vitest/load-word-lists.ts"],
    // The full-game simulations play hundreds of games; a CI runner needs
    // longer than the five-second default for one of those files.
    testTimeout: 60_000,
  },
});
