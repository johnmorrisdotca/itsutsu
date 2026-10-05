import { describe, expect, it } from "vitest";

import { decodeLayout, gameCode, isGameSolved, makeSuido, newGame, turnAt, type Game } from "@johnmorrisdotca/suido";
import {
  blockOf as packageBlockOf,
  firstUnsolvedSuidoLevel,
  levelSolution,
  nextSuidoLevel,
  openSuidoLevels,
  SUIDO_LEVEL_COUNTS,
  SUIDO_SIZES,
  suidoBand,
} from "@johnmorrisdotca/suido/levels-info";

import { fixedLevelOf, nextLevelLabel } from "../fixedLevel";
import { puzzleAsked, puzzleQuery } from "../puzzleAddress";
import { checkSolution } from "../puzzleCheck";
import { progressFits } from "../puzzleProgress";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { freshSeed, SUIDO_LEVEL_SEED_BLOCK } from "../random";
import { generatePuzzle, preparePuzzle, puzzleLoads } from "../generate";
import { resumedGame } from "./play";
import { checkSuido, suidoCodeFits } from "./check";
import { isSuidoLevelAt, suidoLevelBand, suidoLevelCount, SUIDO_HUGE_LEVELS_PER_SIZE, SUIDO_LEVELS_PER_SIZE } from "./levelCounts";
import {
  firstUnsolvedSuidoLevelAt,
  loadSuidoLevelsAt,
  nextSuidoLevelAt,
  openSuidoLevelsAt,
  suidoLevelOfBoard,
  suidoLevelPuzzle,
  suidoLevelsAt,
  suidoLevelsLoaded,
} from "./levels";
import { suidoModeOf } from "./mode";
import { suidoLevelOfSeed, suidoLevelSeed } from "./seed";
import { SUIDO_LEVEL_SIZES, isSuidoHugeSize, isSuidoLevelSize, pipeSize, suidoShapeOf, suidoSizeFromAddress, suidoSizeInAddress, suidoSizeKey, suidoSizeOfKey, suidoSizeWord } from "./sizes";

/**
 * SUIDO'S LEVELS AS THE SITE TAKES THEM. Every level itself — proved to have one
 * answer, measured, ordered, marked — is proved in Suido's own repository on every
 * build; what is held here is what the site adds: each level a puzzle named by its
 * number, a size kept as one number, a solve of it checked, and every code short
 * enough for the routes that carry it.
 */

/** The 14×14 levels stay unloaded until the last test of this file, so a size that was never loaded can be asked about. */
const NEVER_LOADED = 14;

describe("a level the site has not loaded", () => {
  it("is no level of any board, and so a solve of one is refused rather than guessed at", async () => {
    const [board] = (await import("@johnmorrisdotca/suido/levels-14x14")).SUIDO_14X14[0]!;
    expect(suidoLevelsLoaded(NEVER_LOADED)).toBe(false);
    expect(suidoLevelOfBoard(NEVER_LOADED, board)).toBeNull();
    // A plain 14×14 level is also a board of the shape the site makes from a seed, so it is that which passes here: one with a twist the seeded boards lack has no such door.
    const twisted = (await import("@johnmorrisdotca/suido/levels-14x14")).SUIDO_14X14.find((row) => /locked|walls|wrap|pumps|inlet/.test(row[2]))!;
    expect(checkSuido(NEVER_LOADED, twisted[0], twisted[0])).toEqual({ ok: false, reason: "the givens are not a board of that size" });
  });
});

describe("a size, kept as one number", () => {
  it("is a square's side, and for the four long boards its width and then its height in two digits each", () => {
    expect(pipeSize(5, 7)).toBe(507);
    expect(pipeSize(20, 50)).toBe(2050);
    expect(SUIDO_LEVEL_SIZES).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 20, 28, 507, 610, 814, 2050]);
    expect(suidoShapeOf(2050)).toEqual({ width: 20, height: 50 });
    expect(suidoShapeOf(7)).toEqual({ width: 7, height: 7 });
    expect(suidoShapeOf(814)).toEqual({ width: 8, height: 14 });
    expect(suidoShapeOf(100)).toBeNull();
    expect(suidoShapeOf(1)).toBeNull();
  });

  it("is joined to the package's name for it in two functions and nowhere else, and they are each other's inverse", () => {
    for (const key of SUIDO_SIZES) {
      const size = suidoSizeOfKey(key);
      expect(size, key).not.toBeNull();
      expect(suidoSizeKey(size!), key).toBe(key);
      expect(isSuidoLevelSize(size!), key).toBe(true);
    }
    // Every size the package has, and no other: the site's list is the package's.
    // The package lists the huge squares after the long boards; the site's tiles keep every square together, so the same sizes in another order.
    expect(SUIDO_SIZES.map((key) => suidoSizeOfKey(key)).sort((a, b) => a! - b!)).toEqual([...SUIDO_LEVEL_SIZES].sort((a, b) => a - b));
    expect(suidoSizeOfKey("nonsense")).toBeNull();
  });

  it("is said as the board is, 5×7, and written into an address so a link says what it is", () => {
    expect(suidoSizeWord(814)).toBe("8×14");
    expect(suidoSizeWord(9)).toBe("9×9");
    expect(suidoSizeInAddress(507)).toBe("5x7");
    expect(suidoSizeInAddress(9)).toBe("9");
    expect(suidoSizeFromAddress("5x7")).toBe(507);
    expect(suidoSizeFromAddress("9")).toBe(9);
    expect(suidoSizeFromAddress("507")).toBe(507);
    expect(suidoSizeFromAddress("9x9")).toBe(9);
    expect(suidoSizeFromAddress("x")).toBeNull();
  });

  it("is what the puzzle's spec lists, which a set-up shows four tiles at a time and turns through", () => {
    expect(PUZZLE_SPECS.suido.sizes).toEqual([...SUIDO_LEVEL_SIZES]);
    // Sixteen sizes make four shelves of four: 5 to 8, 9 to 12, 13 to 28, and the long boards.
    expect(SUIDO_LEVEL_SIZES).toHaveLength(16);
    expect(PUZZLE_SPECS.suido.shelves).toBe(true);
    expect(PUZZLE_SPECS.suido.offered).toEqual([5, 7, 9, 12]);
    for (const size of PUZZLE_SPECS.suido.offered) expect(PUZZLE_SPECS.suido.sizes).toContain(size);
  });
});

describe("what the site reads without the package's loader, held to the package's own", () => {
  it("has the package's number of levels in every size, and its thirds", () => {
    for (const key of SUIDO_SIZES) {
      const size = suidoSizeOfKey(key)!;
      const count = SUIDO_LEVEL_COUNTS[key]!;
      expect(suidoLevelCount(size), key).toBe(count);
      expect(isSuidoHugeSize(size) ? SUIDO_HUGE_LEVELS_PER_SIZE : SUIDO_LEVELS_PER_SIZE, key).toBe(count);
      for (const level of [1, 2, Math.floor(count / 3), Math.floor(count / 3) + 1, Math.floor((2 * count) / 3), Math.floor((2 * count) / 3) + 1, count]) expect(suidoLevelBand(size, level), `${key} ${level}`).toBe(suidoBand(key, level));
      expect(isSuidoLevelAt(size, 0)).toBe(false);
      expect(isSuidoLevelAt(size, count)).toBe(true);
      expect(isSuidoLevelAt(size, count + 1)).toBe(false);
    }
    expect(suidoLevelCount(8)).toBe(256);
    expect(suidoLevelCount(15)).toBe(0);
  });

  it("opens a block when the one before it is solved, as the package says", () => {
    const solved = new Set([...Array(16).keys()].map((at) => at + 1));
    for (const [key, size] of [["7x7", 7], ["8x14", 814]] as const) {
      expect(openSuidoLevelsAt(size, new Set())).toBe(openSuidoLevels(key, new Set()));
      expect(openSuidoLevelsAt(size, solved)).toBe(openSuidoLevels(key, solved));
      expect(nextSuidoLevelAt(size, solved)).toBe(nextSuidoLevel(key, solved));
      expect(firstUnsolvedSuidoLevelAt(size, solved)).toBe(firstUnsolvedSuidoLevel(key, solved));
    }
    expect(openSuidoLevelsAt(7, new Set())).toBe(16);
    expect(openSuidoLevelsAt(7, solved)).toBe(32);
    expect(packageBlockOf(17)).toBe(2);
  });
});

describe("a level's seed", () => {
  it("is its number in a block of its own, and no other seed is a level's", () => {
    expect(suidoLevelSeed(12)).toBe(SUIDO_LEVEL_SEED_BLOCK.from + 12);
    expect(suidoLevelOfSeed(suidoLevelSeed(12))).toBe(12);
    expect(suidoLevelOfSeed(suidoLevelSeed(256))).toBe(256);
    expect(suidoLevelOfSeed(SUIDO_LEVEL_SEED_BLOCK.from)).toBeNull();
    expect(suidoLevelOfSeed(41)).toBeNull();
    expect(suidoLevelOfSeed(1_700_000_005)).toBeNull();
    expect(suidoLevelOfSeed(Number.NaN)).toBeNull();
  });

  it("is never drawn for a board made at random", () => {
    for (let each = 0; each < 5000; each += 1) expect(suidoLevelOfSeed(freshSeed())).toBeNull();
  });

  it("names a level of a Suido and of nothing else but a Tsunagi", () => {
    expect(fixedLevelOf("suido", suidoLevelSeed(7))).toBe(7);
    expect(fixedLevelOf("suido", 41)).toBeNull();
    expect(fixedLevelOf("tsunagi", 12)).toBe(12);
    expect(fixedLevelOf("numberPlace", suidoLevelSeed(7))).toBeNull();
    expect(nextLevelLabel(3, 4)).toBe("Level 4 →");
    expect(nextLevelLabel(5, 3)).toBe("Level 3, the first one you have not finished →");
  });
});

describe("a level in an address", () => {
  it("is asked for by its size and number, and a long board by its shape", () => {
    const asked = puzzleAsked("suido", { size: "5x7", number: "12" });
    expect(asked).toMatchObject({ size: 507, level: "easy", seed: suidoLevelSeed(12), hints: false, clock: "none" });
    expect(puzzleQuery(asked)).toBe("?size=5x7&level=easy&number=12");
    expect(puzzleAsked("suido", { size: "14", number: "200" })).toMatchObject({ size: 14, level: "hard", seed: suidoLevelSeed(200) });
    // The seed that names it is the same ask, so an address from before this form still opens it.
    expect(puzzleAsked("suido", { size: "5", seed: String(suidoLevelSeed(3)) })).toMatchObject({ size: 5, seed: suidoLevelSeed(3) });
  });

  it("is a level only where the size has it, and asks for no clock or help", () => {
    // Past the size's levels, or at a size with none: a board, with the seed drawn afresh.
    expect(puzzleAsked("suido", { size: "5", number: "257" }).seed).toBeNull();
    expect(puzzleAsked("suido", { size: "5", number: "0" }).seed).toBeNull();
    // A size that is none is the usual one, and the level asked for is that size's.
    expect(puzzleAsked("suido", { size: "15", number: "3" })).toMatchObject({ size: 7, seed: suidoLevelSeed(3) });
    expect(puzzleAsked("suido", { size: "5", number: "3", clock: "rabbit", hints: "1" })).toMatchObject({ clock: "none", hints: false });
    // A seed in the levels' block that names no level of the size is no seed either.
    expect(puzzleAsked("suido", { size: "5", seed: String(suidoLevelSeed(900)) }).seed).toBeNull();
  });

  it("leaves a board made from a seed as it was, at the sizes it is made at, and now a long one too", () => {
    expect(puzzleAsked("suido", { size: "7", level: "easy", seed: "41", hints: "1" })).toMatchObject({ size: 7, level: "easy", seed: 41, hints: true });
    expect(puzzleQuery({ size: 7, level: "easy", seed: 41 })).toBe("?size=7&level=easy&seed=41");
    expect(puzzleAsked("suido", { size: "8x14", level: "hard", seed: "41" })).toMatchObject({ size: 814, seed: 41 });
    expect(suidoModeOf({})).toBe("levels");
    expect(suidoModeOf({ mode: "make" })).toBe("make");
    expect(suidoModeOf({ mode: ["make"] })).toBe("make");
    expect(suidoModeOf({ mode: "other" })).toBe("levels");
  });
});

describe("every level, as a puzzle of the site", () => {
  it("is loaded a size at a time, and a puzzle waits for its size only where its seed names a level", async () => {
    expect(puzzleLoads("suido", suidoLevelSeed(3))).toBe(true);
    expect(puzzleLoads("suido", 41)).toBe(false);
    expect(puzzleLoads("suido", null)).toBe(false);
    expect(puzzleLoads("suido")).toBe(false);
    await preparePuzzle("suido", 7, "english", suidoLevelSeed(3));
    expect(suidoLevelsLoaded(7)).toBe(true);
    const made = generatePuzzle("suido", 7, "easy", suidoLevelSeed(12));
    expect(made).toMatchObject({ kind: "suido", size: 7, level: "easy", seed: suidoLevelSeed(12) });
    expect(made.givens).toBe(suidoLevelsAt(7)[11]![0]);
    expect(suidoLevelOfBoard(7, made.givens)).toBe(12);
    // An address naming no level is read as the first, never as an error in render.
    expect(suidoLevelPuzzle(7, 9999).seed).toBe(suidoLevelSeed(1));
  }, 60_000);

  it.each(SUIDO_LEVEL_SIZES.filter((size) => !isSuidoHugeSize(size)).map((size) => [size]))("pays each size %i level's one answer, which fits what the routes accept, in the shape the size says", async (size) => {
    const rows = await loadSuidoLevelsAt(size);
    const shape = suidoShapeOf(size)!;
    expect(rows).toHaveLength(256);
    const seen = new Set<string>();
    for (const [at, row] of rows.entries()) {
      const puzzle = suidoLevelPuzzle(size, at + 1);
      const layout = decodeLayout(puzzle.givens)!;
      expect([layout.width, layout.height]).toEqual([shape.width, shape.height]);
      // A board that is a level of its size, and only that: the check says yes to its answer and no to the board as dealt.
      expect(checkSolution("suido", size, puzzle.givens, puzzle.solution, puzzle.level), `level ${at + 1}`).toEqual({ ok: true });
      expect(progressFits("suido", size, puzzle.givens)).toBe(true);
      expect(suidoCodeFits(puzzle.solution, size)).toBe(true);
      for (const code of [puzzle.givens, puzzle.solution]) {
        expect(code.length, row[0]).toBeLessThanOrEqual(PUZZLE_SPECS.suido.mostCells);
        expect(code.length, row[0]).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
      }
      expect(seen.has(puzzle.givens), `level ${at + 1} is another's board`).toBe(false);
      seen.add(puzzle.givens);
      expect(suidoLevelBand(size, at + 1)).toBe(puzzle.level);
    }
  }, 120_000);

  it("refuses a level's board as the answer to itself, an answer of another size, and a board that is no level", async () => {
    await loadSuidoLevelsAt(5);
    const first = suidoLevelPuzzle(5, 1);
    expect(checkSolution("suido", 5, first.givens, first.givens).ok).toBe(false);
    expect(checkSolution("suido", 6, first.givens, first.solution).ok).toBe(false);
    // A board with edges that join is a sound board, and no level: nobody can claim a level, or be paid for one, with a board of their own.
    const made = makeSuido({ size: 5, wrap: true, seed: 3 });
    expect(suidoLevelOfBoard(5, made.code)).toBeNull();
    expect(checkSolution("suido", 5, made.code, made.answer).ok).toBe(false);
    expect(checkSolution("suido", 5, "not a board", "not a board").ok).toBe(false);
  });
});

describe("playing a level through the package's own turns", () => {
  /** Every piece turned to face as the answer has it, a tap at a time: what a player does. */
  function solvedByTurning(game: Game, answer: readonly number[]): Game {
    let next = game;
    for (let cell = 0; cell < answer.length; cell += 1) {
      for (let guard = 0; guard < 4 && next.masks[cell] !== answer[cell]; guard += 1) next = turnAt(next, cell);
    }
    return next;
  }

  it("is solved by turning every piece to the answer's way, with a locked piece already there and never turned", async () => {
    for (const size of [5, 8, 507, 814]) {
      const rows = await loadSuidoLevelsAt(size);
      let sawLocked = false;
      for (const row of rows) {
        const dealt = newGame(row[0])!;
        const answer = levelSolution(row)!;
        const solved = solvedByTurning(dealt, answer);
        expect(isGameSolved(solved), row[0]).toBe(true);
        for (const cell of dealt.start.locked ?? []) {
          sawLocked = true;
          expect(dealt.masks[cell], "a locked piece is given as the answer has it").toBe(answer[cell]);
          expect(turnAt(dealt, cell)).toBe(dealt);
        }
      }
      expect(sawLocked, `${size} has locked levels`).toBe(true);
    }
  }, 60_000);

  it("is opened again from a half-played code, and not from another board's", async () => {
    const rows = await loadSuidoLevelsAt(6);
    const row = rows.find((each) => each[2].includes("locked"))!;
    const dealt = newGame(row[0])!;
    const turned = turnAt(dealt, dealt.masks.findIndex((_, cell) => turnAt(dealt, cell) !== dealt));
    const back = resumedGame(dealt, gameCode(turned))!;
    expect(back.masks).toEqual(turned.masks);
    // The same pieces with a locked one turned is not this board's.
    const lockedCell = dealt.start.locked![0]!;
    const cheated = { ...dealt, masks: dealt.masks.map((mask, cell) => (cell === lockedCell ? ((mask << 1) | (mask >> 3)) & 15 : mask)) };
    if (cheated.masks[lockedCell] !== dealt.masks[lockedCell]) expect(resumedGame(dealt, gameCode(cheated))).toBeNull();
    const other = newGame(rows.find((each) => each[0] !== row[0] && !each[2].includes("locked"))!.at(0) as string)!;
    expect(resumedGame(dealt, gameCode(other))).toBeNull();
  });
});
