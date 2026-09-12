import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The Computers tab must count PLAYED the same way the Members tab does.
 *
 * `Directory.tsx` was fixed in 0.147.1: a member's PLAYED column read
 * `entry.profile` — the RATING table, which only ever gains a row for a RATED
 * game — so a member whose games were mostly unrated bot-series runs showed a
 * fraction of what they had actually played. `ComputerPlayers.tsx` had the
 * identical bug and was never touched: Kyu showed 10 where he has played 24,
 * Tamenoki 24 where he has 59, Meritalu 1 where he has 36 — the same bots,
 * one tab over, still reading `entry.profile?.computer` for the count.
 *
 * Crude on purpose, in the shape this codebase already checks .tsx files with
 * (see playerRecord.coverage.test.ts, gameLinks.coverage.test.ts): read the
 * source and look for the shape that went wrong, rather than rendering the
 * table against a database.
 */

const SOURCE = readFileSync("src/components/players/ComputerPlayers.tsx", "utf8");

describe("the Computers tab counts every finished game, not only the rated ones", () => {
  it("has ComputerPlayers to check, so a passing run means something", () => {
    expect(SOURCE.length).toBeGreaterThan(200);
  });

  it("does not build the played count from the rated computer-pool profile alone", () => {
    // The reported bug: `record` was `computer ?? { wins: 0, losses: 0, draws: 0 }`,
    // where `computer` is `entry.profile?.computer` — rated games only.
    expect(SOURCE).not.toMatch(/record:\s*computer\s*\?\?/);
  });

  it("reads the same batched tally the Members tab reads", () => {
    // `fetchPlayedTallies` / `gamesPlayed` are the pair `Directory.tsx` uses
    // for exactly this figure — one query for every row on the tab, not one
    // per row, and every finished game rather than only the rated ones.
    expect(SOURCE).toContain("fetchPlayedTallies");
    expect(SOURCE).toContain("gamesPlayed");
  });

  it("does not link the count to rated games alone", () => {
    // Once the number counts every finished game, a link still saying
    // `rated: "yes"` would open a shorter list than the figure beside it
    // promises — the exact fault "Nothing Is A Dead End" is about, the other
    // way round from the usual case.
    expect(SOURCE).not.toMatch(/rated:\s*"yes"/);
  });
});
