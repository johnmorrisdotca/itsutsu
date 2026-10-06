import { describe, expect, it } from "vitest";

import { decodeLayout } from "@johnmorrisdotca/suido";
import { levelAnswer, type LevelRow } from "@johnmorrisdotca/suido/levels-info";
import { SUIDO_10X10 } from "@johnmorrisdotca/suido/levels-10x10";
import { SUIDO_11X11 } from "@johnmorrisdotca/suido/levels-11x11";
import { SUIDO_12X12 } from "@johnmorrisdotca/suido/levels-12x12";
import { SUIDO_13X13 } from "@johnmorrisdotca/suido/levels-13x13";
import { SUIDO_14X14 } from "@johnmorrisdotca/suido/levels-14x14";
import { SUIDO_20X20 } from "@johnmorrisdotca/suido/levels-20x20";
import { SUIDO_20X50 } from "@johnmorrisdotca/suido/levels-20x50";
import { SUIDO_28X28 } from "@johnmorrisdotca/suido/levels-28x28";
import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
import { SUIDO_5X7 } from "@johnmorrisdotca/suido/levels-5x7";
import { SUIDO_6X10 } from "@johnmorrisdotca/suido/levels-6x10";
import { SUIDO_6X6 } from "@johnmorrisdotca/suido/levels-6x6";
import { SUIDO_7X7 } from "@johnmorrisdotca/suido/levels-7x7";
import { SUIDO_8X14 } from "@johnmorrisdotca/suido/levels-8x14";
import { SUIDO_8X8 } from "@johnmorrisdotca/suido/levels-8x8";
import { SUIDO_9X9 } from "@johnmorrisdotca/suido/levels-9x9";
import { makeSuido } from "@johnmorrisdotca/suido";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { HASH_LENGTH, suidoBoardHash } from "./boardHash";
import { SUIDO_LEVEL_BOARDS } from "./levelBoards.data";
import { suidoLevelBand, suidoLevelCount } from "./levelCounts";
import { loadSuidoLevelsAt, suidoBoardOf, suidoLevelOfBoard } from "./levels";
import { SUIDO_CODE_MOST, SUIDO_HUGE_SIZES, SUIDO_LEVEL_SIZES, suidoShapeOf } from "./sizes";

/**
 * EVERY LEVEL, AS A SERVER KNOWS IT: by a hash of the board and its first characters, and not by the boards, which are
 * a megabyte of data a function would carry (`functions:size`). The levels themselves are proved in the package on every build; what is
 * held here is that the server's few bytes name exactly those boards (a level that changes fails here until
 * `node scripts/suido-level-hashes.ts` is run), that a solve of one is checked as a level's, and that every code fits what the routes accept.
 */
const DATA: Record<number, readonly LevelRow[]> = {
  5: SUIDO_5X5,
  6: SUIDO_6X6,
  7: SUIDO_7X7,
  8: SUIDO_8X8,
  9: SUIDO_9X9,
  10: SUIDO_10X10,
  11: SUIDO_11X11,
  12: SUIDO_12X12,
  13: SUIDO_13X13,
  14: SUIDO_14X14,
  20: SUIDO_20X20,
  28: SUIDO_28X28,
  507: SUIDO_5X7,
  610: SUIDO_6X10,
  814: SUIDO_8X14,
  2050: SUIDO_20X50,
};

describe("a level, known by its hash", () => {
  it("has a hash and a prefix for every level the package has, in its order, and no two alike", () => {
    expect(Object.keys(SUIDO_LEVEL_BOARDS).map(Number)).toEqual([...SUIDO_LEVEL_SIZES].sort((a, b) => a - b));
    for (const size of SUIDO_LEVEL_SIZES) {
      const rows = DATA[size]!;
      const known = SUIDO_LEVEL_BOARDS[size]!;
      expect(rows.length, String(size)).toBe(suidoLevelCount(size));
      expect(known.hashes, `${size} hashes`).toHaveLength(rows.length * HASH_LENGTH);
      expect(known.prefixes, `${size} prefixes`).toHaveLength(rows.length * known.prefixLength);
      rows.forEach(([board], at) => {
        expect(suidoBoardOf(size, at + 1), `${size} level ${at + 1}`).toEqual({ prefix: board.slice(0, known.prefixLength), hash: suidoBoardHash(board) });
      });
      expect(new Set(rows.map(([board]) => suidoBoardHash(board))).size, `${size} hashes`).toBe(rows.length);
      // The first characters find a level's solves in the database, so no two levels of a size may share them.
      expect(new Set(rows.map(([board]) => board.slice(0, known.prefixLength))).size, `${size} prefixes`).toBe(rows.length);
      // A prefix is no longer than it has to be, so the data stays small (`functions:size`): one less would not have told the levels apart.
      if (known.prefixLength > 12) expect(new Set(rows.map(([board]) => board.slice(0, known.prefixLength - 1))).size, `${size} prefix length`).toBeLessThan(rows.length);
    }
  });

  it("is a hash of sixteen hex digits, whatever the board", () => {
    for (const size of SUIDO_LEVEL_SIZES) for (const [board] of DATA[size]!) expect(suidoBoardHash(board)).toMatch(/^[0-9a-f]{16}$/);
  });

  it("names a level by its board, and a board that is no level of the size by nothing", () => {
    for (const size of SUIDO_LEVEL_SIZES) {
      DATA[size]!.forEach(([board], at) => expect(suidoLevelOfBoard(size, board), `${size} level ${at + 1}`).toBe(at + 1));
      expect(suidoBoardOf(size, 1)).toBeDefined();
      expect(suidoBoardOf(size, 0)).toBeUndefined();
      expect(suidoBoardOf(size, suidoLevelCount(size) + 1)).toBeUndefined();
      const shape = suidoShapeOf(size)!;
      // A board of the same shape made from a seed is no level; nor is another size's level.
      const made = makeSuido({ width: shape.width, height: shape.height, kind: "network", seed: 3 });
      expect(suidoLevelOfBoard(size, made.code)).toBeNull();
    }
    expect(suidoLevelOfBoard(20, DATA[28]![0]![0])).toBeNull();
    expect(suidoLevelOfBoard(5, DATA[6]![0]![0])).toBeNull();
    expect(suidoLevelOfBoard(99, DATA[5]![0]![0])).toBeNull();
  });

  it("is checked as a huge level's, in full, whatever the hash says: the answer must be an answer, and a level's board is never its own answer", () => {
    for (const size of SUIDO_HUGE_SIZES) {
      DATA[size]!.forEach((row, at) => {
        const answer = levelAnswer(row)!;
        expect(checkSolution("suido", size, row[0], answer, suidoLevelBand(size, at + 1)), `${size} level ${at + 1}`).toEqual({ ok: true });
      });
      expect(checkSolution("suido", size, DATA[size]![0]![0], DATA[size]![0]![0]).ok).toBe(false);
    }
  });

  it("fits every code the routes accept (the biggest are the huge sizes', and `levels.test.ts` holds every size's to the same limit), which is as long as the longest level and the longest board made, and no longer", () => {
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
    for (const size of SUIDO_LEVEL_SIZES) await expect(loadSuidoLevelsAt(size)).rejects.toThrow("browser only");
  });
});
