import { describe, expect, it } from "vitest";

import { POINTS_A_HELP, pointsFor } from "../puzzlePoints";
import { PUZZLE_SPECS } from "../puzzles.constants";
import { checkSolution } from "../puzzleCheck";
import { kumimojiPoints } from "./check";
import { generateKumimoji } from "./generate";
import { KUMIMOJI_BAG } from "./tiles.constants";
import { loadTileWords } from "./tileWords";

/**
 * KUMIMOJI ON THIS SITE: what the site offers of the game and how it prices a
 * solve. The rules themselves are the Kumimoji package's (`packages/kumimoji`)
 * and tested there.
 */
describe("Kumimoji as the site offers it", () => {
  it("offers Quick 7 and Classic 11, eleven by default, and a bag for every hand", () => {
    expect(PUZZLE_SPECS.kumimoji.offered).toEqual([7, 11]);
    expect(PUZZLE_SPECS.kumimoji.defaultSize).toBe(11);
    for (const size of PUZZLE_SPECS.kumimoji.sizes) expect(KUMIMOJI_BAG[size]).toBeGreaterThan(size);
  });

  it("checks a dealt game through the puzzles' one check", async () => {
    await loadTileWords();
    const puzzle = generateKumimoji(7, "medium", 42);
    expect(checkSolution("kumimoji", 7, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
    expect(checkSolution("kumimoji", 7, puzzle.givens, puzzle.givens, "medium").ok).toBe(false);
  });

  it("costs a Kumimoji a hint's worth of points a press", () => {
    const bag = "a".repeat(50);
    expect(pointsFor("kumimoji", 11, bag, 0, 2, "", 10 * 60_000)).toBe(kumimojiPoints(bag, 10 * 60_000) - 2 * POINTS_A_HELP);
    expect(pointsFor("kumimoji", 11, bag, 0, 0, "", 10 * 60_000)).toBe(kumimojiPoints(bag, 10 * 60_000));
  });
});
