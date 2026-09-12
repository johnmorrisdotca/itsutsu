import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A group's heading must count the bucket, not the slice shown of it.
 *
 * `SHOWN` caps how many of each group `/play` shows — "Lately finished"
 * capped at five, so the header does not grow into a page nobody reaches the
 * bottom of. The heading read `items.length` where `items` was already
 * `groups[group].slice(0, SHOWN[group])` — so a bucket of fourteen finished
 * games printed "5", the cap, and never said fourteen were behind it.
 *
 * `shownGroup` (myGames.ts) bundles the cap and the bucket's own size into
 * one answer so a header cannot read one without the other. This checks that
 * `MyGamesList.tsx` actually calls it, rather than reinventing the slice
 * inline the way the bug was written — the same "read the source for the
 * shape that went wrong" check this codebase already uses elsewhere (see
 * ComputerPlayers.coverage.test.ts, playerRecord.coverage.test.ts).
 */

const SOURCE = readFileSync("src/components/mine/MyGamesList.tsx", "utf8");

describe("MyGamesList counts each group's true size, not the capped slice", () => {
  it("has MyGamesList.tsx to check, so a passing run means something", () => {
    expect(SOURCE.length).toBeGreaterThan(200);
  });

  it("caps a group's display through shownGroup, not a bare slice the heading then re-counts", () => {
    expect(SOURCE).toContain("shownGroup(");
  });

  it("does not slice a group at the call site and count the slice's own length separately", () => {
    // The exact bug: sliced here, counted there, with no link between the two.
    expect(SOURCE).not.toMatch(/groups\[group\]\.slice\(/);
  });
});
