import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A stranger reading /games must see real figures, not a fixed nought — and
 * none of the people behind them.
 *
 * `PublicCatalogue` once set `played: 0` on every family for anybody without a
 * session, with a comment claiming the line "is never printed" for a
 * stranger — but the family header printed it unconditionally. Production
 * held 116 finished games; a stranger saw "0 played here" on all eleven family
 * cards, which is the exact opposite of the truth and the opposite of the "be
 * the first to play" invitation the empty-table rule exists to make.
 *
 * Since the figures strip, both halves of the page read `fetchCatalogueStats`
 * and hand it through `forReader`, which is the one place that decides what a
 * stranger is shown of it. This holds the stranger's half to both.
 *
 * Crude on purpose, in the shape this codebase already checks .tsx files with
 * (see gameLinks.coverage.test.ts, playerRecord.coverage.test.ts): read the
 * source, look for the shape that went wrong. A cleverer check would need the
 * page rendered against a database, which is a browser test —
 * `e2e/games-stats.spec.ts` and `e2e/gate.spec.ts` are those.
 */

/*
 * The stranger's half lives in its own file beside the page, moved out whole
 * when the page reached the 500-line gate; the lobby's half is still the page.
 */
const SOURCE = readFileSync("src/app/games/PublicCatalogue.tsx", "utf8");
const LOBBY = readFileSync("src/app/games/page.tsx", "utf8");

// Just the stranger's half — everything from PublicCatalogue's own definition
// onward, so a correct computation anywhere above it cannot make this pass for
// the wrong reason.
const START = SOURCE.indexOf("function PublicCatalogue");
const PUBLIC = SOURCE.slice(START);

describe("the public catalogue", () => {
  it("has PublicCatalogue to check, so a passing run means something", () => {
    expect(START).toBeGreaterThan(0);
    expect(PUBLIC.length).toBeGreaterThan(200);
    // And the page still hands a reader with no session to it.
    expect(LOBBY).toContain("<PublicCatalogue");
  });

  it("does not hardcode played to nought", () => {
    // The reported bug, however it is phrased: a literal 0 handed over
    // regardless of what the database holds.
    expect(PUBLIC).not.toMatch(/played:\s*0\s*,/);
  });

  it("reads the same figures the signed-in path reads", () => {
    // Not a private figure — nobody's name is in a count of finished games —
    // so a stranger gets the real numbers from the same reads, not a second
    // set invented for this path.
    expect(PUBLIC).toContain("fetchCatalogueStats()");
    expect(LOBBY).toContain("fetchCatalogueStats()");
  });

  it("shapes them for a reader with no session before drawing them", () => {
    // `forReader(…, false)` is where the names come off. Handing the raw
    // figures to the catalogue would put members' names on an open page.
    expect(PUBLIC).toMatch(/forReader\([^;]*?,\s*false\)/);
    expect(PUBLIC).not.toMatch(/forReader\([^;]*?,\s*true\)/);
    expect(PUBLIC).toContain("stats={stats}");
  });
});
