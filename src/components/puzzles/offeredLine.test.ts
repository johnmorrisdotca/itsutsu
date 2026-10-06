import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PUZZLE_KIND_LIST, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS, sizesOffered } from "@/lib/puzzles/puzzles.constants";

import { offeredLine } from "./offeredLine";
import { sizeWord } from "./puzzles.constants";

/**
 * A FRONT DOOR NAMES EVERY BOARD ITS SET-UP OFFERS. John, 2026-09-26:
 * Tsunagi's said "4×4, 5×5, 6×6, 7×7 · easy, medium, hard" while its set-up
 * offered 8×8 and 9×9 behind "Bigger boards". The line is `offeredLine`, the
 * boards are `sizesOffered`, and the set-ups read the same list.
 */
describe("the line under a puzzle's description", () => {
  it("names every board the set-up offers, in order, and every level, for every puzzle", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const line = offeredLine(kind);
      const [sizes, levels] = line.split(" · ");
      expect(sizes, `${kind}'s boards`).toBe(sizesOffered(kind).map((side) => sizeWord(side, kind)).join(", "));
      for (const level of PUZZLE_SPECS[kind].levels) expect(levels, `${kind}'s levels`).toContain(PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase());
    }
  });

  it("lists a shelved puzzle's every size, and only the tiles of one that is not", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const spec = PUZZLE_SPECS[kind];
      // A shelved kind turns through every size but the ones it never lists (Mahjong's square of eight, the browser tests' own).
      expect(sizesOffered(kind)).toEqual(spec.shelves === true ? spec.sizes.filter((side) => spec.unlisted?.includes(side) !== true) : spec.offered);
      for (const side of spec.offered) expect(sizesOffered(kind)).toContain(side);
    }
    expect(offeredLine("tsunagi")).toMatch(/^4×4, 5×5, 6×6, 7×7, 8×8, 9×9, 10×10, 11×11, 12×12, 13×13, 14×14, 15×15, 20×20, 25×25, 30×30 · /);
    expect(sizesOffered("mahjong")).toEqual([8, 9, 10, 15, 20, 26]);
  });

  it("is what the front door prints, and a shelved set-up turns through the same list", () => {
    const door = readFileSync("src/components/puzzles/PuzzleFrontDoor.tsx", "utf8");
    expect(door).toContain("offeredLine(kind, say)");
    expect(door).not.toMatch(/spec\.offered\.map/);
    // The shelved puzzles: Tsunagi, whose set-up is its own, and Pop Gomoji, Sudoku (4 to 16, then 6 to 25), Bridges (7 to 13, then 13 to 25), Picture logic (5 to 20, then 15 to 50), Mahjong (Torii to the Turtle, then Castle to the Palace), the Cube (2×2 to 5×5, then 4×4 to 7×7), Suido's Make a board (its sixteen sizes) and Jirai (7 to 16, then 9 to 32), on the shared one. All turn through the list.
    expect(PUZZLE_KIND_LIST.filter((kind) => PUZZLE_SPECS[kind].shelves === true)).toEqual(["numberPlace", "gomojiPop", "tsunagi", "bridges", "pictureLogic", "mahjong", "cube", "suido", "jirai"]);
    const tsunagi = readFileSync("src/components/puzzles/TsunagiSetUp.tsx", "utf8");
    expect(tsunagi).toContain('sizesOffered("tsunagi")');
    expect(tsunagi).not.toContain("spec.sizes");
    expect(readFileSync("src/components/puzzles/PuzzleBoardAndSizes.tsx", "utf8")).toContain("sizesOffered(kind)");
  });
});
