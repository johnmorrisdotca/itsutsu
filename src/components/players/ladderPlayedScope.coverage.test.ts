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
 * hover onto the heading itself. This checks the ladder actually passes it,
 * rather than the fix living only in the components that can draw it.
 *
 * IT READS `LadderMore.tsx`, which is where the table moved when the ladder
 * learned to sort and page: `Ladder.tsx` reads the database and cannot draw in a
 * browser, because `fetchLadderPage` imports `server-only`. The claim is
 * unchanged — the file holding the `RecordTable` call is the file that has to
 * pass `playedScope` — and the gate followed the call rather than the name.
 */

const SOURCE = readFileSync("src/components/players/LadderMore.tsx", "utf8");

describe("the Ladder's Played column says what it counts", () => {
  it("has the ladder's table to check, so a passing run means something", () => {
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
