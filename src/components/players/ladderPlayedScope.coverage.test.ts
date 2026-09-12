import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The Ladder's "Played" heading must say it counts rated games in the people
 * pool, because the Members tab's identical heading does not.
 *
 * Both tabs draw their table through the same `RecordTable`/`RecordHeadings`,
 * so both show the word "Played" over their numbers. The Ladder's row is
 * `of: { pool: "people", rated: "yes" }` — rated games against people alone —
 * while the Members tab's is every finished game. For the same person that
 * read 5 on one tab and 14 on the other, one click apart, with nothing on
 * either page saying the two columns counted different things.
 *
 * The Ladder's scope is correct — a ladder is inherently rated — so the fix
 * is not to change what it counts, only to say so: `RecordTable`'s optional
 * `playedScope` puts the same sentence the streak cell already gives on
 * hover onto the heading itself. This checks Ladder.tsx actually passes it,
 * rather than the fix living only in the components that can draw it.
 */

const SOURCE = readFileSync("src/components/players/Ladder.tsx", "utf8");

describe("the Ladder's Played column says what it counts", () => {
  it("has Ladder.tsx to check, so a passing run means something", () => {
    expect(SOURCE.length).toBeGreaterThan(200);
  });

  it("passes RecordTable a playedScope, not just an of on each row", () => {
    expect(SOURCE).toContain("playedScope");
  });

  it("scopes the heading to the same pool and rated-ness the rows themselves count", () => {
    expect(SOURCE).toMatch(/playedScope=\{\{[^}]*pool:\s*RATING_POOLS\.people/);
    expect(SOURCE).toMatch(/playedScope=\{\{[^}]*rated:\s*"yes"/);
  });
});
