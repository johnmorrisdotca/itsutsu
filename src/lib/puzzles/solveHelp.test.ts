import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { helpOpensOn, SOLVE_HELP_LIST, SOLVE_HELP_SAYS, SOLVE_HELPS, solveHelpOf, strongestHelp } from "./solveHelp";

/**
 * HOW A SOLVE WAS HELPED: one column, read one way. A helped solve counts as
 * solved, scores nothing and stays off the fastest tables; only explosions off
 * also opens no block.
 */
describe("the helps", () => {
  it("open what a solve opens, all but explosions off", () => {
    expect(helpOpensOn(null)).toBe(true);
    expect(helpOpensOn(SOLVE_HELPS.cheated)).toBe(true);
    expect(helpOpensOn(SOLVE_HELPS.explosionsSoft)).toBe(true);
    expect(helpOpensOn(SOLVE_HELPS.explosionsOff)).toBe(false);
  });

  it("keep the one that costs more where two were used", () => {
    expect(strongestHelp([null, null])).toBeNull();
    expect(strongestHelp([SOLVE_HELPS.cheated, SOLVE_HELPS.explosionsSoft])).toBe(SOLVE_HELPS.cheated);
    expect(strongestHelp([SOLVE_HELPS.cheated, SOLVE_HELPS.explosionsOff])).toBe(SOLVE_HELPS.explosionsOff);
    expect(strongestHelp([null, SOLVE_HELPS.explosionsSoft])).toBe(SOLVE_HELPS.explosionsSoft);
  });

  it("read back only what they are, and each says so", () => {
    for (const help of SOLVE_HELP_LIST) {
      expect(solveHelpOf(help)).toBe(help);
      expect(SOLVE_HELP_SAYS[help]).toMatch(/^Helped: /);
    }
    expect(solveHelpOf(null)).toBeNull();
    expect(solveHelpOf("hinted")).toBeNull();
  });
});

/**
 * THE READERS THAT RANK, read from their source: every fastest table and the
 * feed's "a new best time" ask for unhelped solves, and the keeper scores a
 * helped one nothing. A new reader that ranks times has to say the same.
 */
describe("every reader that ranks solves by time leaves helped ones out", () => {
  const read = (path: string) => readFileSync(join(process.cwd(), "src/lib", path), "utf8");

  it("the fastest tables, the level's leaderboard, the record's fastest order and the feed's best time", () => {
    expect(read("puzzles/server/puzzleSolves.ts")).toMatch(/where: \{ kind, size: Number\(size\), level, solved: true, helped: null \}/);
    expect(read("puzzles/server/tsunagiRecords.ts")).toMatch(/givens, solved: true, helped: null \}/);
    expect(read("puzzles/server/puzzleRecord.ts")).toMatch(/\{ solved: true, helped: null \}/);
    expect(read("feed/siteNewsWrite.ts")).toMatch(/solved: true, helped: null \}/);
  });

  it("the keeper scores a helped solve nothing and tells the feed nothing", () => {
    const keeper = read("puzzles/server/puzzleSolves.ts");
    expect(keeper).toMatch(/const points = helped !== null \? 0 :/);
    expect(keeper).toMatch(/const best = helped !== null \? undefined :/);
  });
});
