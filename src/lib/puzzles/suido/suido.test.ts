import { describe, expect, it } from "vitest";

import { decodeLayout, gameCode, hintFor, isGameSolved, newGame, turnAt } from "@johnmorrisdotca/suido";

import { puzzleAsked, puzzleQuery, keptRunAsked } from "../puzzleAddress";
import { checkSolution } from "../puzzleCheck";
import { cellsFilled } from "../puzzlePoints";
import { progressFits } from "../puzzleProgress";
import { PUZZLE_SPECS } from "../puzzles.constants";
import { freshSeed } from "../random";
import { generatePuzzle } from "../generate";
import { solvedAnswerOf } from "../solvedAnswer";
import { boardOf, checkSuido, suidoPieces } from "./check";
import { generateSuido } from "./generate";
import { freshSuidoSeed, suidoKindOfSeed } from "./seed";

/** A seed that makes a network: in the block `NETWORK_SEED_BLOCK` keeps for them. */
const NETWORK = 1_700_000_005;

describe("suido: the boards", () => {
  it("makes the same board for one size, level and seed, and another for another seed", () => {
    // Every size the levels come in: the boards made from a seed are made at the long ones too (a size is 507 for 5×7).
    for (const size of PUZZLE_SPECS.suido.sizes) {
      for (const level of PUZZLE_SPECS.suido.levels) {
        const first = generateSuido(size, level, 41);
        expect(generateSuido(size, level, 41)).toEqual(first);
        expect(generateSuido(size, level, 42).givens).not.toBe(first.givens);
      }
    }
  });

  it("keeps the seed asked for, whichever seeds the package tried to come near the level", () => {
    for (const seed of [3, 41, 7000, NETWORK]) expect(generateSuido(9, "hard", seed).seed).toBe(seed);
  });

  it("says drains or network by the seed, and a fresh seed of either kind says it", () => {
    expect(suidoKindOfSeed(41)).toBe("drains");
    expect(suidoKindOfSeed(NETWORK)).toBe("network");
    for (let each = 0; each < 20; each += 1) {
      expect(suidoKindOfSeed(freshSuidoSeed("network"))).toBe("network");
      expect(suidoKindOfSeed(freshSuidoSeed("drains"))).toBe("drains");
      expect(suidoKindOfSeed(freshSeed())).toBe("drains");
    }
    expect(decodeLayout(generateSuido(7, "medium", NETWORK).givens)!.kind).toBe("network");
    expect(decodeLayout(generateSuido(7, "medium", 41).givens)!.kind).toBe("drains");
  });

  it("makes a board whose own answer solves it, in both kinds, and checks it by the site's rules", () => {
    for (const seed of [41, NETWORK]) {
      const puzzle = generatePuzzle("suido", 7, "medium", seed);
      expect(checkSolution("suido", 7, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
      // The board as dealt is not its answer, and a code of another size is no board of this one.
      expect(checkSolution("suido", 7, puzzle.givens, puzzle.givens).ok).toBe(false);
      expect(checkSolution("suido", 5, puzzle.givens, puzzle.solution).ok).toBe(false);
    }
  });

  it("refuses a board the site does not make: one that wraps, one that is not square, or one with two pumps", () => {
    const made = generateSuido(5, "easy", 7).givens;
    expect(made.startsWith("5x5d:")).toBe(true);
    expect(boardOf(made, 5)).not.toBeNull();
    const wrapped = made.replace("5x5d:", "5x5dw:");
    expect(boardOf(wrapped, 5)).toBeNull();
    expect(checkSuido(5, wrapped, wrapped).ok).toBe(false);
    // 4 across and 5 down, a pump in its corner: a board to the package, and not a square one.
    const tall = `4x5d:h${"0".repeat(19)}`;
    expect(decodeLayout(tall)).not.toBeNull();
    expect(boardOf(tall, 4)).toBeNull();
    expect(boardOf(tall, 5)).toBeNull();
    const twoPumps = `3x3:h${"0".repeat(7)}h`;
    expect(decodeLayout(twoPumps)!.sources).toHaveLength(2);
    expect(boardOf(twoPumps, 3)).toBeNull();
    expect(checkSuido(7, "not a board", "not a board").ok).toBe(false);
  });

  it("finds the one answer again from the board alone, for a page whose answer was not kept", () => {
    for (const seed of [41, NETWORK]) {
      const puzzle = generatePuzzle("suido", 5, "easy", seed);
      const found = solvedAnswerOf("suido", 5, "easy", puzzle.givens);
      expect(found).not.toBeNull();
      expect(checkSolution("suido", 5, puzzle.givens, found!).ok).toBe(true);
    }
  });

  it("plays: a tap turns a piece, and the turns the answer needs solve the board", () => {
    const puzzle = generatePuzzle("suido", 5, "easy", 41);
    let game = newGame(puzzle.givens)!;
    expect(isGameSolved(game)).toBe(false);
    const answer = decodeLayout(puzzle.solution)!.cells;
    for (let step = 0; step < 100 && !isGameSolved(game); step += 1) {
      const cell = hintFor(game, answer);
      if (cell === null) break;
      game = turnAt(game, cell);
    }
    expect(isGameSolved(game)).toBe(true);
    expect(checkSolution("suido", 5, puzzle.givens, gameCode(game)).ok).toBe(true);
  });
});

describe("suido: kept, scored and addressed", () => {
  it("keeps a half-played board in the package's code, and refuses a code of another size", () => {
    const puzzle = generatePuzzle("suido", 7, "easy", 41);
    expect(progressFits("suido", 7, puzzle.givens)).toBe(true);
    expect(progressFits("suido", 9, puzzle.givens)).toBe(false);
    expect(progressFits("suido", 7, "")).toBe(false);
  });

  it("scores five a piece, so a bigger board is worth more and a board with nothing on it nothing", () => {
    const small = generatePuzzle("suido", 5, "easy", 41);
    const big = generatePuzzle("suido", 12, "easy", 41);
    expect(cellsFilled("suido", 5, small.givens)).toBe(suidoPieces(small.givens));
    expect(cellsFilled("suido", 12, big.givens)).toBeGreaterThan(cellsFilled("suido", 5, small.givens));
    expect(suidoPieces("not a board")).toBe(0);
  });

  it("carries drains or network in the address until a seed says it, and the seed says it from then on", () => {
    expect(puzzleAsked("suido", {}).pipes).toBe("drains");
    expect(puzzleAsked("suido", { pipes: "network" }).pipes).toBe("network");
    expect(puzzleAsked("suido", { pipes: "network", seed: "41" }).pipes).toBe("drains");
    expect(puzzleAsked("suido", { seed: String(NETWORK) }).pipes).toBe("network");
    expect(puzzleQuery({ size: 7, level: "medium", seed: null, pipes: "network" })).toBe("?size=7&level=medium&pipes=network");
    expect(puzzleQuery({ size: 7, level: "medium", seed: NETWORK, pipes: "network" })).toBe(`?size=7&level=medium&seed=${NETWORK}`);
    expect(puzzleQuery({ size: 7, level: "medium", seed: null, pipes: "drains" })).toBe("?size=7&level=medium");
    expect(keptRunAsked("suido", { size: 7, level: "medium", seed: NETWORK, checksAllowed: null, hintsAllowed: false, strict: false }).pipes).toBe("network");
  });

  it("makes every size and level quickly enough for a phone, the hardest of them under a second", () => {
    for (const size of PUZZLE_SPECS.suido.sizes) {
      const started = performance.now();
      generateSuido(size, "hard", 4242);
      expect(performance.now() - started, `${size}×${size} hard`).toBeLessThan(1000);
    }
  });
});
