import { describe, expect, it } from "vitest";

import { decodeLayout } from "@johnmorrisdotca/suido";
import { levelAnswer, type LevelRow } from "@johnmorrisdotca/suido/levels-info";
import { SUIDO_20X20 } from "@johnmorrisdotca/suido/levels-20x20";
import { SUIDO_20X50 } from "@johnmorrisdotca/suido/levels-20x50";
import { SUIDO_28X28 } from "@johnmorrisdotca/suido/levels-28x28";
import { makeSuido } from "@johnmorrisdotca/suido";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { PREFIX, suidoBoardHash } from "./boardHash";
import { SUIDO_HUGE_BOARDS } from "./hugeLevels.data";
import { suidoLevelBand, suidoLevelCount } from "./levelCounts";
import { loadSuidoLevelsAt, suidoLevelOfBoard, suidoHugeBoardOf } from "./levels";
import { SUIDO_CODE_MOST, SUIDO_HUGE_SIZES, suidoShapeOf } from "./sizes";

/**
 * THE HUGE LEVELS, AS A SERVER KNOWS THEM: by a hash of the board and its first characters, and not by the boards, which are
 * 280 KB of data a function would carry (`functions:size`). The levels themselves are proved in the package on every build; what is
 * held here is that the server's few bytes name exactly those boards, that a solve of one is checked as a level's, and that
 * every code fits what the routes accept.
 */
const DATA: Record<number, readonly LevelRow[]> = { 20: SUIDO_20X20, 28: SUIDO_28X28, 2050: SUIDO_20X50 };

describe("a huge level, known by its hash", () => {
  it("has a hash and a prefix for every level the package has, in its order, and no two alike", () => {
    expect(Object.keys(SUIDO_HUGE_BOARDS).map(Number)).toEqual([...SUIDO_HUGE_SIZES]);
    for (const size of SUIDO_HUGE_SIZES) {
      const rows = DATA[size]!;
      expect(SUIDO_HUGE_BOARDS[size], String(size)).toHaveLength(rows.length);
      expect(rows.length).toBe(suidoLevelCount(size));
      rows.forEach(([board], at) => {
        expect(SUIDO_HUGE_BOARDS[size]![at], `${size} level ${at + 1}`).toEqual({ prefix: board.slice(0, PREFIX), hash: suidoBoardHash(board) });
      });
      expect(new Set(SUIDO_HUGE_BOARDS[size]!.map((one) => one.hash)).size, `${size} hashes`).toBe(rows.length);
      // The first characters find a level's solves in the database, so no two levels of a size may share them.
      expect(new Set(SUIDO_HUGE_BOARDS[size]!.map((one) => one.prefix)).size, `${size} prefixes`).toBe(rows.length);
    }
  });

  it("names a level by its board, and a board that is no level of the size by nothing", () => {
    for (const size of SUIDO_HUGE_SIZES) {
      DATA[size]!.forEach(([board], at) => expect(suidoLevelOfBoard(size, board), `${size} level ${at + 1}`).toBe(at + 1));
      expect(suidoHugeBoardOf(size, 1)).toBeDefined();
      expect(suidoHugeBoardOf(size, 65)).toBeUndefined();
      const shape = suidoShapeOf(size)!;
      // A board of the same shape made from a seed is no level; nor is another size's level.
      const made = makeSuido({ width: shape.width, height: shape.height, kind: "network", seed: 3 });
      expect(suidoLevelOfBoard(size, made.code)).toBeNull();
    }
    expect(suidoLevelOfBoard(20, DATA[28]![0]![0])).toBeNull();
  });

  it("is checked as a level's, in full, whatever the hash says: the answer must be an answer, and a level's board is never its own answer", () => {
    for (const size of SUIDO_HUGE_SIZES) {
      DATA[size]!.forEach((row, at) => {
        const answer = levelAnswer(row)!;
        expect(checkSolution("suido", size, row[0], answer, suidoLevelBand(size, at + 1)), `${size} level ${at + 1}`).toEqual({ ok: true });
      });
      expect(checkSolution("suido", size, DATA[size]![0]![0], DATA[size]![0]![0]).ok).toBe(false);
    }
  });

  it("fits every code the routes accept, which is as long as the longest level and the longest board made, and no longer", () => {
    let longest = 0;
    for (const size of SUIDO_HUGE_SIZES) {
      for (const row of DATA[size]!) {
        const answer = levelAnswer(row)!;
        longest = Math.max(longest, row[0].length, answer.length);
        expect(decodeLayout(row[0])).not.toBeNull();
      }
      // A board made on request, at the most squares the set-up asks for: a network with a few dozen of them.
      const shape = suidoShapeOf(size)!;
      const made = makeSuido({ width: shape.width, height: shape.height, kind: "network", bigs: 25, blocks: 25, seed: 5 });
      longest = Math.max(longest, made.code.length, made.answer.length);
    }
    expect(longest).toBeLessThanOrEqual(SUIDO_CODE_MOST);
    expect(longest).toBeLessThanOrEqual(PUZZLE_SPECS.suido.mostCells);
    expect(longest).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
    // Room, but not much: the cap is the longest by a little, since it is every route's body limit.
    expect(SUIDO_CODE_MOST - longest).toBeLessThan(200);
  });

  it("is never loaded on a server, where there is no window: the boards are the browser's", async () => {
    for (const size of SUIDO_HUGE_SIZES) await expect(loadSuidoLevelsAt(size)).rejects.toThrow("browser only");
  });
});
