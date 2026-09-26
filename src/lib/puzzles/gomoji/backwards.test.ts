import { beforeAll, describe, expect, it } from "vitest";

import { prepareEveryPuzzle, generatePuzzle } from "../generate";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "../puzzles.types";
import { freshSeed } from "../random";
import { decodeKanaGuesses } from "../gomojiKana/kanaCode";
import { decodeGuesses, languageOf } from "./code";
import { backwardsGuesses, backwardsKeep, breaksBackwardsRule, breaksKeep } from "./backwards";
import { hiddenOfPlay, rowsOfPlay } from "./backwardsPlay";
import { sakasaScore } from "./backwardsScore";
import { backwardsDailySeed, dayOfBackwardsSeed, freshBackwardsSeed, innerBackwardsGivens, isBackwardsGivens, isBackwardsSeed } from "./backwardsSeed";

beforeAll(prepareEveryPuzzle);

const KINDS: readonly PuzzleKind[] = ["gomoji", "gomojiMot", "gomojiWort", "gomojiKana"];
const LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard"];
const SEEDS = [1_650_000_001, 1_687_654_321, backwardsDailySeed("2026-10-03")];

const guessesOf = (kind: PuzzleKind, size: number, answer: string): string[] =>
  (kind === "gomojiKana" ? decodeKanaGuesses(answer, size) : decodeGuesses(answer, size, languageOf(kind))) ?? [];

describe("Gomoji Sakasa 逆さ: played backwards", () => {
  it("every letter uncovered is used again: a green stays, an orange is used, a grey never comes back", () => {
    // CRANE against the word CRATE: C, R, A green; N grey; E green.
    expect(breaksBackwardsRule("gomoji", ["crane"], "crate", "trace")).toMatch(/first must stay C/);
    expect(breaksBackwardsRule("gomoji", ["crane"], "crate", "craze")).toBeNull();
    expect(breaksBackwardsRule("gomoji", ["crane"], "crate", "crake")).toBeNull();
    // N was grey, and is never typed again.
    expect(breaksBackwardsRule("gomoji", ["slate"], "crane", "snare")).toMatch(/S was grey/);
    // An orange must be used again, anywhere.
    expect(breaksBackwardsRule("gomoji", ["irony"], "crane", "track")).toMatch(/must use N|R was|must stay/);
    // Nor is a word played twice.
    expect(breaksKeep(backwardsKeep("gomoji", ["crane"], "crate"), "crane")).toMatch(/played already/);
  });

  it("never leaves a player with no word at all: the hidden word keeps to every row", () => {
    const word = "crate";
    const rows = ["slate", "grate", "irate"];
    expect(breaksBackwardsRule("gomoji", rows, word, word)).toBeNull();
  });

  it.each(KINDS)("%s: has a way through every row without the word, at every length and level", (kind) => {
    for (const size of PUZZLE_SPECS[kind].sizes) {
      for (const level of LEVELS) {
        for (const seed of SEEDS) {
          const puzzle = generatePuzzle(kind, size, level, seed);
          expect(isBackwardsGivens(puzzle.givens)).toBe(true);
          const way = guessesOf(kind, size, puzzle.solution);
          expect(way.length, `${kind} ${size} ${level} ${seed}`).toBe(backwardsGuesses(kind, size, level));
          expect(way).not.toContain(hiddenOfPlay(kind, size, puzzle.givens));
          expect(checkSolution(kind, size, puzzle.givens, puzzle.solution, level), `${kind} ${size} ${level}`).toEqual({ ok: true });
        }
      }
    }
  });

  it.each(KINDS)("%s: the check refuses a way that stops short, breaks the rule or types the word, and keeps a game caught by it", (kind) => {
    const size = PUZZLE_SPECS[kind].defaultSize;
    const puzzle = generatePuzzle(kind, size, "medium", SEEDS[0]!);
    const word = hiddenOfPlay(kind, size, puzzle.givens)!;
    const way = guessesOf(kind, size, puzzle.solution);
    expect(checkSolution(kind, size, puzzle.givens, way.slice(0, -1).join(""), "medium").ok).toBe(false);
    expect(checkSolution(kind, size, puzzle.givens, [...way.slice(0, -1), word].join(""), "medium").ok).toBe(false);
    // Caught: the word on the last row, and on none before it.
    expect(checkOutOfGuesses(kind, size, puzzle.givens, [...way.slice(0, 2), word].join(""), "medium")).toEqual({ ok: true });
    expect(checkOutOfGuesses(kind, size, puzzle.givens, way.slice(0, 2).join(""), "medium").ok).toBe(false);
    // Nor is a Sakasa's word ever a day's: that would give today's word away.
    expect(innerBackwardsGivens(puzzle.givens)).not.toBeNull();
  });

  it("levels run backwards: harder is more rows to get through, and the same as an ordinary Gomoji's counts the other way round", () => {
    expect(backwardsGuesses("gomoji", 5, "easy")).toBe(6);
    expect(backwardsGuesses("gomoji", 5, "medium")).toBe(7);
    expect(backwardsGuesses("gomoji", 5, "hard")).toBe(9);
    expect(rowsOfPlay("gomoji", 5, "hard", "^1650000001:CRANE")).toBe(9);
    expect(rowsOfPlay("gomoji", 5, "hard", "CRANE")).toBe(6);
  });

  it("scores every row got through, and a bonus for all of them", () => {
    expect(sakasaScore("crate", ["slate", "crate"])).toEqual({ rows: 20, through: 0, total: 20 });
    expect(sakasaScore("crate", ["slate", "grate", "irate"])).toEqual({ rows: 60, through: 50, total: 110 });
  });
});

describe("a Sakasa's seeds", () => {
  it("are a block of their own, which an ordinary draw never lands in", () => {
    for (let at = 0; at < 2000; at += 1) expect(isBackwardsSeed(freshSeed())).toBe(false);
    for (let at = 0; at < 200; at += 1) {
      const seed = freshBackwardsSeed();
      expect(isBackwardsSeed(seed)).toBe(true);
      expect(dayOfBackwardsSeed(seed)).toBeNull();
    }
  });

  it("name a day for the day's Sakasa, the same for everybody", () => {
    expect(backwardsDailySeed("2026-10-03")).toBe(1_620_261_003);
    expect(dayOfBackwardsSeed(1_620_261_003)).toBe("2026-10-03");
    expect(dayOfBackwardsSeed(1_000_000_001)).toBeNull();
  });
});
