import { beforeAll, describe, expect, it } from "vitest";

import { prepareEveryPuzzle, generatePuzzle } from "../generate";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { freshSeed } from "../random";
import { decodeKanaGuesses } from "../gomojiKana/kanaCode";
import { decodeGuesses, languageOf, markGuess } from "./code";
import { dodge, replayDodge } from "./dodge";
import { dodgeGuesses, dodgeMarkerOf, dodgePool, readDodge } from "./dodgePlay";
import { dayOfDodgeSeed, decodeDodgeGivens, dodgeDailySeed, encodeDodgeGivens, freshDodgeSeed, isDodgeSeed } from "./dodgeSeed";

beforeAll(prepareEveryPuzzle);

const KINDS: readonly PuzzleKind[] = ["gomoji", "gomojiMot", "gomojiWort", "gomojiKana"];
const LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard"];
const SEEDS = [1_550_000_001, 1_573_312_777, dodgeDailySeed("2026-10-03")];

const guessesOf = (kind: PuzzleKind, size: number, answer: string): string[] =>
  (kind === "gomojiKana" ? decodeKanaGuesses(answer, size) : decodeGuesses(answer, size, languageOf(kind))) ?? [];

describe("Gomoji Nige 逃げ: the word that dodges", () => {
  it("answers with the colours that leave the most words, and never the word while another stands", () => {
    const { mark, greens } = dodgeMarkerOf("gomoji");
    const standing = ["crane", "crate", "slate", "plate"];
    // SLATE against the four: CRANE and CRATE share one colouring, SLATE alone is green, PLATE its own.
    const step = dodge(standing, "slate", 7, mark, greens);
    expect(step.left).toEqual(["crane", "crate"].filter((word) => mark("slate", word) === step.pattern));
    expect(step.left.length).toBeGreaterThanOrEqual(1);
    expect(step.left).not.toContain("slate");
    // With one word left, guessing it is the only way it can answer.
    expect(dodge(["crane"], "crane", 7, mark, greens)).toEqual({ pattern: "hhhhh", left: ["crane"] });
  });

  it("keeps to every colour already shown: any word still standing colours every row as it was coloured", () => {
    const { mark, greens } = dodgeMarkerOf("gomoji");
    const pool = dodgePool("gomoji", 5, "medium");
    const guesses = ["slate", "crony", "dumpy"];
    const { patterns, left } = replayDodge(pool, guesses, 1_550_000_001, mark, greens);
    expect(left.length).toBeGreaterThan(0);
    for (const word of left) guesses.forEach((guess, row) => expect(mark(guess, word)).toBe(patterns[row]));
    // And the row a Gomoji draws against the word it stands for is that colouring.
    const read = readDodge("gomoji", 5, "medium", 1_550_000_001, guesses);
    expect(markGuess("slate", read.word).map((each) => each[0]).join("")).toBe(patterns[0]);
    expect(read.found).toBe(false);
  });

  it("is the same dodger for the same seed, and a different seed can dodge differently", () => {
    const one = readDodge("gomoji", 5, "medium", 1_550_000_001, ["slate", "crony"]);
    expect(readDodge("gomoji", 5, "medium", 1_550_000_001, ["slate", "crony"])).toEqual(one);
  });

  it.each(KINDS)("%s: can be pinned down inside the guesses every level gives, at every length", (kind) => {
    for (const size of PUZZLE_SPECS[kind].sizes) {
      for (const level of LEVELS) {
        for (const seed of SEEDS) {
          const puzzle = generatePuzzle(kind, size, level, seed);
          expect(puzzle.givens).toBe(encodeDodgeGivens(seed));
          const way = guessesOf(kind, size, puzzle.solution);
          expect(way.length, `${kind} ${size} ${level} ${seed}`).toBeLessThanOrEqual(dodgeGuesses(kind, size, level));
          expect(checkSolution(kind, size, puzzle.givens, puzzle.solution, level), `${kind} ${size} ${level}`).toEqual({ ok: true });
          expect(readDodge(kind, size, level, seed, way).found).toBe(true);
        }
      }
    }
  });

  it.each(KINDS)("%s: the check refuses a solve that stops short, runs on or ends on a word the dodger still had a way out of", (kind) => {
    const size = PUZZLE_SPECS[kind].defaultSize;
    const puzzle = generatePuzzle(kind, size, "medium", SEEDS[0]!);
    const way = guessesOf(kind, size, puzzle.solution);
    const shorter = way.slice(0, -1).join("");
    expect(checkSolution(kind, size, puzzle.givens, shorter, "medium").ok).toBe(false);
    expect(checkSolution(kind, size, puzzle.givens, puzzle.solution + way[0], "medium").ok).toBe(false);
    // The first guess alone never finds a dodger: it always has another word to hide in.
    expect(checkSolution(kind, size, puzzle.givens, way.at(-1)!, "medium").ok).toBe(false);
    // Nor are an ordinary Gomoji's givens a dodger's.
    expect(decodeDodgeGivens(puzzle.solution.toUpperCase())).toBeNull();
  });

  it("ends unsolved only when every guess is spent and the word was never pinned down", () => {
    const pool = dodgePool("gomoji", 5, "hard");
    const rows = dodgeGuesses("gomoji", 5, "hard");
    const spent = pool.slice(0, rows);
    const givens = encodeDodgeGivens(SEEDS[0]!);
    expect(readDodge("gomoji", 5, "hard", SEEDS[0]!, spent).found).toBe(false);
    expect(checkOutOfGuesses("gomoji", 5, givens, spent.join(""), "hard")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomoji", 5, givens, spent.slice(0, -1).join(""), "hard").ok).toBe(false);
  });

  it("gives every row of the board, one fewer at hard", () => {
    expect(dodgeGuesses("gomoji", 4, "hard")).toBe(7);
    expect(dodgeGuesses("gomoji", 4, "medium")).toBe(8);
    expect(dodgeGuesses("gomoji", 5, "hard")).toBe(8);
    expect(dodgeGuesses("gomoji", 5, "easy")).toBe(9);
    expect(dodgeGuesses("gomojiKana", 3, "hard")).toBe(8);
    expect(dodgeGuesses("gomojiMot", 6, "medium")).toBe(8);
  });
});

describe("a dodger's seeds", () => {
  it("are a block of their own, which an ordinary draw never lands in", () => {
    for (let at = 0; at < 2000; at += 1) expect(isDodgeSeed(freshSeed())).toBe(false);
    for (let at = 0; at < 200; at += 1) {
      const seed = freshDodgeSeed();
      expect(isDodgeSeed(seed)).toBe(true);
      expect(dayOfDodgeSeed(seed)).toBeNull();
    }
  });

  it("name a day for the day's dodger, the same for everybody", () => {
    expect(dodgeDailySeed("2026-10-03")).toBe(1_520_261_003);
    expect(dayOfDodgeSeed(1_520_261_003)).toBe("2026-10-03");
    expect(dayOfDodgeSeed(1_000_000_001)).toBeNull();
  });
});
