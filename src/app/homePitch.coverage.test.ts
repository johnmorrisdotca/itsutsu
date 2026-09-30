import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The home page must not hardcode a count the code already knows.
 *
 * `src/app/page.tsx` said "Thirty of them" in plain prose. `GameList.tsx`, one
 * click away at /games/list, computes the true count as
 * `{RULE_VARIANT_LIST.length} games in {GAME_FAMILIES.length} families` — 39
 * in 11, live. Two anonymous pages contradicting each other about the same
 * catalogue.
 *
 * Crude on purpose, in the shape this codebase already checks .tsx files with:
 * read the source and look for the shape that went wrong, rather than
 * rendering the page.
 */

const SOURCE = readFileSync("src/app/page.tsx", "utf8");

describe("the home page computes its own game count rather than writing it down", () => {
  it("has the page to check, so a passing run means something", () => {
    expect(SOURCE.length).toBeGreaterThan(200);
  });

  it("does not say a fixed word for how many games there are", () => {
    // The reported bug: "Thirty of them" while the catalogue said 39.
    expect(SOURCE).not.toMatch(/\bThirty of them\b/);
  });

  it("reads RULE_VARIANT_LIST rather than writing the count down twice", () => {
    expect(SOURCE).toContain("RULE_VARIANT_LIST");
  });

  it("interpolates the count into the sentence rather than typing a number", () => {
    // Not merely importing the list — actually reading `.length` into the
    // words "board games", so the sentence tracks the catalogue rather than
    // agreeing with it by coincidence on the day this was written.
    expect(SOURCE).toMatch(/\$\{RULE_VARIANT_LIST\.length\}\s*board games/);
  });

  it("counts the whole catalogue in the hero, board games, puzzles and party games alike", () => {
    // It said "48 board games for two people" long after the puzzles, the party games and the cards arrived.
    expect(SOURCE).toMatch(/plural\(EVERY_KIND_KEY\.length, "game"\)/);
    expect(SOURCE).not.toMatch(/board games for two people/);
  });
});
