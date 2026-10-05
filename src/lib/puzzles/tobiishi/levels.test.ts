import { TOBIISHI_CHALLENGE_PACKS, generateTobiishiChallenge, isGameSolved, jumpAt, legalJumps, pegCount, solve, type Game } from "@johnmorrisdotca/tobiishi";
import { draw } from "@johnmorrisdotca/tobiishi/draw";
import { describe, expect, it } from "vitest";

import { PUZZLE_SPECS } from "../puzzles.constants";
import { checkTobiishi } from "./check";
import { TOBIISHI_BOARDS, TOBIISHI_GOALS_A_BOARD, TOBIISHI_LEVELS_A_SIZE, isTobiishiLevelAt, tobiishiLevelCount } from "./levelCounts";
import { tobiishiChallengeOf, tobiishiCodeOf, tobiishiLevelOfBoard, tobiishiLevelPuzzle, tobiishiPacks, tobiishiRefOf, tobiishiRefOfCode } from "./levels";
import { tobiishiCodeFits } from "./progress";
import { TOBIISHI_SIZES, isTobiishiSize, tobiishiBand, tobiishiJumpsWord, tobiishiSizeLabel } from "./sizes";
import { TOBIISHI_MOST_JUMPS, encodeJumps, jumpsFit, readJumps, replayJumps } from "./way";

/** The sizes of Tobiishi, held to the package's own table and rules. */
describe("Tobiishi's sizes and level counts are the package's", () => {
  it("has the package's nine boards of three goal holes, so 27 levels at each of its three lengths", () => {
    expect(tobiishiPacks()).toHaveLength(TOBIISHI_BOARDS);
    for (const pack of tobiishiPacks()) expect(TOBIISHI_CHALLENGE_PACKS[pack].goals).toHaveLength(TOBIISHI_GOALS_A_BOARD);
    expect(TOBIISHI_LEVELS_A_SIZE).toBe(27);
    for (const size of TOBIISHI_SIZES) expect(tobiishiLevelCount(size)).toBe(27);
    expect(tobiishiLevelCount(4)).toBe(0);
  });

  it("names a length by the jumps in its shortest way, which the package's three difficulties make", () => {
    for (const [size, difficulty] of [[3, "easy"], [6, "medium"], [9, "hard"]] as const) {
      expect(tobiishiBand(size)).toBe(difficulty);
      const pack = tobiishiPacks()[0]!;
      const challenge = generateTobiishiChallenge(pack, TOBIISHI_CHALLENGE_PACKS[pack].goals[0]!.id, difficulty);
      expect(challenge.answer).toHaveLength(size);
    }
    expect(PUZZLE_SPECS.tobiishi.sizes).toEqual([...TOBIISHI_SIZES]);
    expect(isTobiishiSize(6)).toBe(true);
    expect(isTobiishiSize(5)).toBe(false);
    expect(tobiishiSizeLabel(3)).toBe("Short");
    expect(tobiishiJumpsWord(9)).toBe("9 jumps");
    expect(isTobiishiLevelAt(3, 27)).toBe(true);
    expect(isTobiishiLevelAt(3, 28)).toBe(false);
    expect(isTobiishiLevelAt(3, 0)).toBe(false);
  });

  it("writes every hole of every board as a column and a row that fit one base-36 character", () => {
    for (const pack of tobiishiPacks()) {
      const game = generateTobiishiChallenge(pack, TOBIISHI_CHALLENGE_PACKS[pack].goals[0]!.id, "easy").game;
      for (const cell of game.board.cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(Math.max(cell.x, cell.y)).toBeLessThan(36);
      }
    }
  });
});

describe("the package's drawing", () => {
  it("has one rect, the tray behind the holes, which the site's paper and wood stand in for (PACKAGE_TRAY_OFF)", () => {
    for (const pack of tobiishiPacks()) {
      const game = generateTobiishiChallenge(pack, TOBIISHI_CHALLENGE_PACKS[pack].goals[0]!.id, "easy").game;
      const svg = draw(game, { material: "stone" });
      expect(svg.match(/<rect /g), pack).toHaveLength(1);
      // And it is the first thing in the picture, a direct child of the svg, as the stylesheet's selector says.
      expect(svg).toMatch(/^<svg [^>]*><rect /);
    }
  });
});

describe("every Tobiishi level", () => {
  const every = TOBIISHI_SIZES.flatMap((size) => Array.from({ length: tobiishiLevelCount(size) }, (_, at) => ({ size, level: at + 1 })));

  it("is named once, by a code the package can make again", () => {
    const codes = new Set<string>();
    for (const { size, level } of every) {
      const ref = tobiishiRefOf(size, level)!;
      const code = tobiishiCodeOf(ref);
      expect(tobiishiRefOfCode(code)).toEqual(ref);
      expect(tobiishiLevelOfBoard(size, code)).toBe(level);
      expect(code.length).toBeLessThanOrEqual(25);
      codes.add(code);
    }
    expect(codes.size).toBe(81);
  });

  it("starts with one more peg than its shortest way has jumps, not already solved, and is made the same every time", () => {
    for (const { size, level } of every) {
      const ref = tobiishiRefOf(size, level)!;
      const game = tobiishiChallengeOf(ref).game;
      expect(pegCount(game), `${tobiishiCodeOf(ref)}`).toBe(size + 1);
      expect(isGameSolved(game)).toBe(false);
      expect(tobiishiChallengeOf(ref).game.pegs).toEqual(game.pegs);
    }
  });

  it("is a puzzle whose own answer the check accepts, in 36 characters at the most", () => {
    for (const { size, level } of every) {
      const puzzle = tobiishiLevelPuzzle(size, level);
      expect(puzzle).toMatchObject({ kind: "tobiishi", size, level: tobiishiBand(size), seed: level });
      expect(puzzle.solution).toHaveLength(size * 4);
      expect(puzzle.solution.length).toBeLessThanOrEqual(TOBIISHI_MOST_JUMPS * 4);
      expect(checkTobiishi(size, puzzle.givens, puzzle.solution), puzzle.givens).toEqual({ ok: true });
    }
  });

  it("reads a level number outside its length as the first level, never as an error", () => {
    expect(tobiishiLevelPuzzle(6, 99).seed).toBe(1);
    expect(tobiishiLevelPuzzle(6, 0).seed).toBe(1);
  });
});

describe("a Tobiishi answer is checked by replaying its jumps", () => {
  const puzzle = tobiishiLevelPuzzle(6, 5);
  const start = tobiishiChallengeOf(tobiishiRefOf(6, 5)!).game;

  it("accepts any legal run that leaves one peg in the goal, not only the level's own answer", () => {
    // The package's solver finds its own way, which need not be the level's.
    const found = solve(start, 200000);
    expect(found.status).toBe("solved");
    let game: Game = start;
    for (const jump of found.jumps) game = jumpAt(game, jump.from, jump.to);
    expect(checkTobiishi(6, puzzle.givens, encodeJumps(game))).toEqual({ ok: true });
  });

  it("refuses a run that stops early, a run with an illegal jump, and anything that is not a run", () => {
    expect(checkTobiishi(6, puzzle.givens, puzzle.solution.slice(0, -4)).ok).toBe(false);
    expect(checkTobiishi(6, puzzle.givens, "")).toMatchObject({ ok: false });
    expect(checkTobiishi(6, puzzle.givens, "0000")).toMatchObject({ ok: false });
    expect(checkTobiishi(6, puzzle.givens, "zzzz")).toMatchObject({ ok: false });
    expect(checkTobiishi(6, puzzle.givens, puzzle.solution + "0000")).toMatchObject({ ok: false });
    expect(checkTobiishi(6, puzzle.givens, puzzle.solution.slice(1) + puzzle.solution[0]).ok).toBe(false);
    expect(checkTobiishi(6, puzzle.givens, "not a run").ok).toBe(false);
  });

  it("refuses a code that is no level of that length, and the answer of one level offered for another", () => {
    expect(checkTobiishi(3, puzzle.givens, puzzle.solution).ok).toBe(false);
    expect(checkTobiishi(6, "english:centre:5", puzzle.solution).ok).toBe(false);
    expect(checkTobiishi(6, "nowhere:centre:6", puzzle.solution).ok).toBe(false);
    expect(checkTobiishi(6, "english:nowhere:6", puzzle.solution).ok).toBe(false);
    expect(checkTobiishi(6, "english:centre:6:extra", puzzle.solution).ok).toBe(false);
    const other = tobiishiLevelPuzzle(6, 6);
    expect(checkTobiishi(6, other.givens, puzzle.solution).ok).toBe(false);
  });

  it("refuses a run that leaves one peg in a hole that is not the goal", () => {
    // Walk every order of jumps from the start (seven pegs: a few hundred at most) for one that ends on a single peg away from the goal.
    const goal = start.target!;
    const search = (game: Game): Game | null => {
      if (pegCount(game) === 1) return game.pegs[goal] ? null : game;
      for (const jump of legalJumps(game)) {
        const found = search(jumpAt(game, jump.from, jump.to));
        if (found !== null) return found;
      }
      return null;
    };
    const elsewhere = search(start);
    expect(elsewhere, "a level of seven pegs has a run that ends away from its goal").not.toBeNull();
    expect(checkTobiishi(6, puzzle.givens, encodeJumps(elsewhere!))).toMatchObject({ ok: false, reason: expect.stringContaining("goal") });
  });
});

describe("a Tobiishi run is kept as four characters a jump", () => {
  it("writes and reads a run both ways, and refuses text that is not one", () => {
    const puzzle = tobiishiLevelPuzzle(9, 12);
    const start = tobiishiChallengeOf(tobiishiRefOf(9, 12)!).game;
    const played = replayJumps(start, puzzle.solution)!;
    expect(encodeJumps(played)).toBe(puzzle.solution);
    expect(readJumps(puzzle.solution)).toHaveLength(9);
    expect(readJumps("abc")).toBeNull();
    expect(readJumps("AB12")).toBeNull();
    expect(replayJumps(start, puzzle.solution.repeat(2))).toBeNull();
    // Half a run is a run, and where it has got to is where it left the pegs.
    const half = replayJumps(start, puzzle.solution.slice(0, 16))!;
    expect(half.history).toHaveLength(4);
    expect(pegCount(half)).toBe(10 - 4);
  });

  it("fits what a kept run can be: its alphabet, whole jumps and no more than the most any level has", () => {
    expect(tobiishiCodeFits("")).toBe(true);
    expect(tobiishiCodeFits("0123")).toBe(true);
    expect(tobiishiCodeFits("012")).toBe(false);
    expect(tobiishiCodeFits("0123".repeat(10))).toBe(false);
    expect(tobiishiCodeFits("0123".repeat(9))).toBe(true);
    expect(jumpsFit("0123".repeat(9))).toBe(true);
    expect(tobiishiCodeFits("01-3")).toBe(false);
  });
});
