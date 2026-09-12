import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A player's own page must not print a rating nobody has earned.
 *
 * `player?.rating ?? "—"` reads the people-pool rating column directly, which
 * defaults to `RATING_START` (1600) the moment nobody has settled it — so
 * every one of the seven computer players, none of whom has a people-pool
 * rating, printed "Rating 1600" beside their real computer-pool figure. It is
 * the only rating on the site that skips `ratingShown()`, whose own doc says
 * "a rating nobody has earned yet is not a rating of 1500; it is silence."
 * `Directory.tsx` reads the identical `PlayerProfile` through `ratingShown()`
 * and shows a dash for the same row.
 *
 * Crude on purpose, in the shape this codebase already checks .tsx files with
 * (see playerRecord.coverage.test.ts): read the source and look for the shape
 * that went wrong, rather than rendering the page against a database.
 */

const SOURCE = readFileSync("src/app/players/[slug]/page.tsx", "utf8");

describe("a player's own page never prints an unearned default rating", () => {
  it("has the page to check, so a passing run means something", () => {
    expect(SOURCE.length).toBeGreaterThan(200);
  });

  it("does not read the raw rating column for the headline figure", () => {
    // The reported bug: the untouched schema default (1600) printed as though
    // it were an earned rating, for anybody with zero people-pool rated games.
    expect(SOURCE).not.toMatch(/value:\s*player\?\.rating\s*\?\?/);
  });

  it("uses ratingShown, the same rule Directory.tsx applies to the same profile", () => {
    expect(SOURCE).toContain("ratingShown");
  });
});
