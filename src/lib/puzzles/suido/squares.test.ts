import { describe, expect, it } from "vitest";

import { decodeLayout, gameCode, hintFor, isGameSolved, newGame, turnAt, turnedToFaceAt } from "@johnmorrisdotca/suido";

import { generatePuzzle } from "../generate";
import { puzzleAsked, puzzleQuery, keptRunAsked } from "../puzzleAddress";
import { checkSolution } from "../puzzleCheck";
import { progressFits } from "../puzzleProgress";
import { PUZZLE_CODE_LONGEST, PUZZLE_SPECS } from "../puzzles.constants";
import { freshSeed, SUIDO_BIG_SEED_BLOCK, SUIDO_TURN_SEED_BLOCK } from "../random";
import { solvedAnswerOf } from "../solvedAnswer";
import { generateSuido, suidoBigCount } from "./generate";
import { resumedGame } from "./play";
import { freshSuidoSeed, suidoKindOfSeed, suidoPreviewSeed, suidoSquaresOfSeed } from "./seed";
import { SUIDO_CODE_MOST } from "./sizes";

/** A seed that makes a network with big pieces: in the block `SUIDO_BIG_SEED_BLOCK` keeps for them. */
const BIG = SUIDO_BIG_SEED_BLOCK.from + 5;

describe("suido: boards with big pieces", () => {
  it("are said by the seed, which makes them networks, and a fresh seed of either kind says it", () => {
    expect(suidoSquaresOfSeed(41)).toBe("none");
    expect(suidoSquaresOfSeed(1_700_000_005)).toBe("none");
    expect(suidoSquaresOfSeed(BIG)).toBe("big");
    expect(suidoKindOfSeed(BIG)).toBe("network");
    for (let each = 0; each < 30; each += 1) {
      expect(suidoSquaresOfSeed(freshSuidoSeed("network", "big"))).toBe("big");
      expect(suidoSquaresOfSeed(freshSuidoSeed("drains", "big"))).toBe("big");
      expect(suidoKindOfSeed(freshSuidoSeed("drains", "big"))).toBe("network");
      expect(suidoSquaresOfSeed(freshSuidoSeed("drains"))).toBe("none");
      expect(suidoSquaresOfSeed(freshSuidoSeed("network"))).toBe("none");
      expect(suidoSquaresOfSeed(freshSeed())).toBe("none");
    }
    expect(suidoSquaresOfSeed(suidoPreviewSeed({ pipes: "drains", squares: "big" }))).toBe("big");
    expect(suidoKindOfSeed(suidoPreviewSeed({ pipes: "network", squares: "none" }))).toBe("network");
    expect(suidoKindOfSeed(suidoPreviewSeed())).toBe("drains");
  });

  it("have big pieces at every size, as many as the size asks for, and the same for one seed", () => {
    for (const size of PUZZLE_SPECS.suido.sizes) {
      const puzzle = generateSuido(size, "medium", BIG);
      expect(generateSuido(size, "medium", BIG)).toEqual(puzzle);
      const layout = decodeLayout(puzzle.givens)!;
      expect(layout.kind, String(size)).toBe("network");
      expect(layout.bigs?.length ?? 0, String(size)).toBeGreaterThan(0);
      expect(layout.bigs!.length).toBeLessThanOrEqual(suidoBigCount(layout.width * layout.height));
      expect(layout.blocks).toBeUndefined();
      expect(puzzle.givens.length).toBeLessThanOrEqual(SUIDO_CODE_MOST);
      expect(puzzle.givens.length).toBeLessThanOrEqual(PUZZLE_CODE_LONGEST);
    }
    expect(suidoBigCount(25)).toBe(1);
    expect(suidoBigCount(49)).toBe(2);
    expect(suidoBigCount(784)).toBe(25);
  });

  it("are checked by the site's rules: the answer solves it, the board as dealt does not, one piece of a big piece turned alone does not, and a kept board resumes", () => {
    for (const size of [5, 7, 12]) {
      const puzzle = generatePuzzle("suido", size, "medium", BIG);
      expect(checkSolution("suido", size, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
      expect(checkSolution("suido", size, puzzle.givens, puzzle.givens).ok).toBe(false);
      expect(progressFits("suido", size, puzzle.givens)).toBe(true);
      const found = solvedAnswerOf("suido", size, "medium", puzzle.givens);
      expect(found).not.toBeNull();
      const dealt = newGame(puzzle.givens)!;
      const turned = turnAt(dealt, dealt.start.bigs![0]!);
      expect(turned.masks).not.toEqual(dealt.masks);
      expect(resumedGame(dealt, gameCode(turned))!.masks).toEqual(turned.masks);
    }
  });

  it("are played to solved by the package's own hints, a big piece at a time", () => {
    const puzzle = generatePuzzle("suido", 9, "hard", BIG);
    const answer = decodeLayout(puzzle.solution)!.cells;
    let game = newGame(puzzle.givens)!;
    let hints = 0;
    for (let cell = hintFor(game, answer); cell !== null; cell = hintFor(game, answer)) {
      game = turnedToFaceAt(game, cell, answer);
      hints += 1;
      if (hints > 200) throw new Error("hints never finish");
    }
    expect(isGameSolved(game)).toBe(true);
    expect(checkSolution("suido", 9, puzzle.givens, gameCode(game), "hard")).toEqual({ ok: true });
  });

  it("are asked for in the address until a seed is drawn, and the seed says it from then on", () => {
    const asked = puzzleAsked("suido", { size: "7", level: "easy", squares: "big" });
    expect(asked).toMatchObject({ size: 7, seed: null, pipes: "network", squares: "big" });
    expect(puzzleQuery(asked)).toBe("?size=7&level=easy&squares=big");
    // Squares make the network: a drains board asked with them is a network.
    expect(puzzleAsked("suido", { size: "7", level: "easy", squares: "big", pipes: "drains" })).toMatchObject({ pipes: "network", squares: "big" });
    // From a seed, the address says nothing and the seed everything.
    const drawn = puzzleAsked("suido", { size: "7", level: "easy", seed: String(BIG) });
    expect(drawn).toMatchObject({ pipes: "network", squares: "big" });
    expect(puzzleQuery({ ...drawn })).toBe(`?size=7&level=easy&seed=${BIG}`);
    expect(puzzleAsked("suido", { size: "7", level: "easy", seed: "41", squares: "big" })).not.toHaveProperty("squares");
    expect(puzzleAsked("suido", { size: "7", level: "easy" })).not.toHaveProperty("squares");
    expect(keptRunAsked("suido", { size: 7, level: "medium", seed: BIG, checksAllowed: null, hintsAllowed: false, strict: false })).toMatchObject({ pipes: "network", squares: "big" });
    expect(keptRunAsked("suido", { size: 7, level: "medium", seed: 41, checksAllowed: null, hintsAllowed: false, strict: false })).not.toHaveProperty("squares");
  });
});

/** A seed that makes a network with block turns: in the block `SUIDO_TURN_SEED_BLOCK` keeps for them. */
const TURN = SUIDO_TURN_SEED_BLOCK.from + 5;

describe("suido: boards with block turns", () => {
  it("are said by the seed, which makes them networks, apart from big pieces, and inside the most a seed can be", () => {
    expect(SUIDO_TURN_SEED_BLOCK.from + SUIDO_TURN_SEED_BLOCK.size).toBeLessThan(2 ** 31);
    expect(SUIDO_TURN_SEED_BLOCK.from).toBeGreaterThanOrEqual(SUIDO_BIG_SEED_BLOCK.from + SUIDO_BIG_SEED_BLOCK.size);
    expect(suidoSquaresOfSeed(TURN)).toBe("turn");
    expect(suidoSquaresOfSeed(BIG)).toBe("big");
    expect(suidoKindOfSeed(TURN)).toBe("network");
    for (let each = 0; each < 30; each += 1) {
      expect(suidoSquaresOfSeed(freshSuidoSeed("drains", "turn"))).toBe("turn");
      expect(suidoKindOfSeed(freshSuidoSeed("drains", "turn"))).toBe("network");
      expect(suidoSquaresOfSeed(freshSeed())).toBe("none");
    }
    expect(suidoSquaresOfSeed(suidoPreviewSeed({ pipes: "network", squares: "turn" }))).toBe("turn");
  });

  it("have blocks at every size, none of them big pieces, and the same for one seed", () => {
    for (const size of PUZZLE_SPECS.suido.sizes) {
      const puzzle = generateSuido(size, "medium", TURN);
      expect(generateSuido(size, "medium", TURN)).toEqual(puzzle);
      const layout = decodeLayout(puzzle.givens)!;
      expect(layout.kind, String(size)).toBe("network");
      expect(layout.blocks?.length ?? 0, String(size)).toBeGreaterThan(0);
      expect(layout.blocks!.length).toBeLessThanOrEqual(suidoBigCount(layout.width * layout.height));
      expect(layout.bigs).toBeUndefined();
      expect(puzzle.givens.length).toBeLessThanOrEqual(SUIDO_CODE_MOST);
    }
  });

  it("are checked by the site's rules: the answer solves it, the board as dealt does not, a block turns as one, and a kept board resumes", () => {
    for (const size of [5, 7, 12]) {
      const puzzle = generatePuzzle("suido", size, "medium", TURN);
      expect(checkSolution("suido", size, puzzle.givens, puzzle.solution, "medium")).toEqual({ ok: true });
      expect(checkSolution("suido", size, puzzle.givens, puzzle.givens).ok).toBe(false);
      expect(solvedAnswerOf("suido", size, "medium", puzzle.givens)).not.toBeNull();
      const dealt = newGame(puzzle.givens)!;
      const turned = turnAt(dealt, dealt.start.blocks![0]!);
      expect(turned.masks).not.toEqual(dealt.masks);
      expect(resumedGame(dealt, gameCode(turned))!.masks).toEqual(turned.masks);
    }
  });

  it("are played to solved by the package's own hints, a block at a time", () => {
    const puzzle = generatePuzzle("suido", 9, "hard", TURN);
    const answer = decodeLayout(puzzle.solution)!.cells;
    let game = newGame(puzzle.givens)!;
    let hints = 0;
    for (let cell = hintFor(game, answer); cell !== null; cell = hintFor(game, answer)) {
      game = turnedToFaceAt(game, cell, answer);
      hints += 1;
      if (hints > 200) throw new Error("hints never finish");
    }
    expect(isGameSolved(game)).toBe(true);
  });

  it("are asked for in the address until a seed is drawn, and the seed says it from then on", () => {
    const asked = puzzleAsked("suido", { size: "7", level: "easy", squares: "turn" });
    expect(asked).toMatchObject({ size: 7, seed: null, pipes: "network", squares: "turn" });
    expect(puzzleQuery(asked)).toBe("?size=7&level=easy&squares=turn");
    const drawn = puzzleAsked("suido", { size: "7", level: "easy", seed: String(TURN) });
    expect(drawn).toMatchObject({ pipes: "network", squares: "turn" });
    expect(puzzleQuery({ ...drawn })).toBe(`?size=7&level=easy&seed=${TURN}`);
    expect(puzzleAsked("suido", { size: "7", level: "easy", seed: "41", squares: "turn" })).not.toHaveProperty("squares");
    expect(keptRunAsked("suido", { size: 7, level: "medium", seed: TURN, checksAllowed: null, hintsAllowed: false, strict: false })).toMatchObject({ pipes: "network", squares: "turn" });
  });
});
