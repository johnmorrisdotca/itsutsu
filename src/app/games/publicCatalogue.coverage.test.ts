import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A stranger reading /games must see a real count, not a fixed nought.
 *
 * `PublicCatalogue` set `played: 0` on every family for anybody without a
 * session, with a comment claiming the line "is never printed" for a
 * stranger — but `GameCatalogue.tsx`'s family header prints it unconditionally,
 * with no `signedIn` guard. Production holds 116 finished games; a stranger
 * saw "0 played here" on all eleven family cards, which is the exact opposite
 * of the truth and the opposite of the "be the first to play" invitation the
 * empty-table rule exists to make.
 *
 * Crude on purpose, in the shape this codebase already checks .tsx files with
 * (see gameLinks.coverage.test.ts, playerRecord.coverage.test.ts): read the
 * source, look for the shape that went wrong. A cleverer check would need the
 * page rendered against a database, which is a browser test.
 */

const SOURCE = readFileSync("src/app/games/page.tsx", "utf8");

// Just the stranger's half of the page — everything from PublicCatalogue's
// own definition onward, so a correct computation in the signed-in path above
// it cannot make this pass for the wrong reason.
const START = SOURCE.indexOf("function PublicCatalogue");
const PUBLIC = SOURCE.slice(START);

describe("the public catalogue does not print a zero when games exist", () => {
  it("has PublicCatalogue to check, so a passing run means something", () => {
    expect(START).toBeGreaterThan(0);
    expect(PUBLIC.length).toBeGreaterThan(200);
  });

  it("does not hardcode played to nought for every family", () => {
    // The reported bug, however it is phrased: a literal 0 handed to every
    // family regardless of what the database holds.
    expect(PUBLIC).not.toMatch(/played:\s*0\s*,/);
  });

  it("computes played from the same batched read the signed-in path uses", () => {
    // Not a private figure — nobody's name is in a count of finished games —
    // so a stranger gets the real number from the same query, not a second
    // one invented for this path and not a hand-me-down of 0.
    expect(PUBLIC).toContain("fetchPlayedCounts");
    expect(PUBLIC).toMatch(/played:\s*family\.games\.reduce/);
  });
});
