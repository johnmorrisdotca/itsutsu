import { beforeAll, describe, expect, it } from "vitest";

import { generatePuzzle, prepareEveryPuzzle } from "../generate";
import { checkSolution } from "../puzzleCheck";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS, sizesOffered } from "../puzzles.constants";
import type { PuzzleKind } from "../puzzles.types";
import { answersFor } from "../gomoji/code";
import { kanaWordsOf } from "../gomojiKana/kanaWords";
import { fnv1a } from "./dailyCycle";
import { DAILY_WORDS_EPOCH, dailyWordSeed, dayAfter } from "./dailyDay";
import { dailyLanguageOf, dailyLengths, dailyPoolsOf, dailyWordOf, isDailyPoolWord } from "./dailyPools";
import type { PackedDailyPool } from "./dailyWords.types";
import { DAILY_POOL_DE } from "./pool.de.data";
import { DAILY_POOL_EN } from "./pool.en.data";
import { DAILY_POOL_FR } from "./pool.fr.data";
import { DAILY_POOL_JA_3 } from "./pool.ja.3.data";
import { DAILY_POOL_JA_4 } from "./pool.ja.4.data";
import { DAILY_POOL_JA_5 } from "./pool.ja.5.data";

beforeAll(prepareEveryPuzzle);

const WORD_KINDS = PUZZLE_KIND_LIST.filter((kind) => dailyLanguageOf(kind) !== null) as PuzzleKind[];

/** Every published pool entry, named `lang:size:fromCycle`. */
const ENTRIES: [string, PackedDailyPool][] = [
  ...(["en", "fr", "de"] as const).flatMap((lang) =>
    Object.entries({ en: DAILY_POOL_EN, fr: DAILY_POOL_FR, de: DAILY_POOL_DE }[lang]).flatMap(([size, versions]) =>
      versions.map((version): [string, PackedDailyPool] => [`${lang}:${size}:${version.fromCycle}`, version]),
    ),
  ),
  ...([[3, DAILY_POOL_JA_3], [4, DAILY_POOL_JA_4], [5, DAILY_POOL_JA_5]] as const).flatMap(([size, versions]) =>
    versions.map((version): [string, PackedDailyPool] => [`ja:${size}:${version.fromCycle}`, version]),
  ),
];

/** A pool's words as its hash reads them: the order they are written in, one space apart. */
const hashOf = (entry: PackedDailyPool) => fnv1a(`${entry.fromCycle}|${entry.words.split(/\s+/).filter(Boolean).join(" ")}`);

/**
 * THE PUBLISHED POOLS, EACH HELD TO ITS HASH. A pool decides every day of the
 * cycles it serves, so one edited after its first day has rewritten days that
 * people already played. Changed? Put it back, and add the new list as a
 * version from a cycle that has not begun (`node scripts/daily-pools.ts --next
 * <lang>:<size>:<cycle>`). New? Add the line the failure prints.
 */
const PINS: Record<string, number> = {
  "en:4:0": 0x126fc9b3, // 1463 words, 4.0 years to the first repeat
  "en:5:0": 0xf1114fc9, // 2036 words, 5.6 years
  "fr:4:0": 0x79122f8a, // 613 words, 1.7 years
  "fr:5:0": 0x68a38c7b, // 1319 words, 3.6 years
  "de:4:0": 0x93aae4e2, // 677 words, 1.9 years
  "de:5:0": 0x1170abaa, // 1139 words, 3.1 years
  "ja:3:0": 0x15185fec, // 2000 words, 5.5 years
  "ja:4:0": 0xb92dbf57, // 2000 words, 5.5 years
  "ja:5:0": 0xc62c1e70, // 2000 words, 5.5 years
  "de:6:0": 0xaa10573c, // 1702 words, 4.7 years (six letters, 2026-09-26)
  "fr:6:0": 0xe5159bab, // 1810 words, 5.0 years (six letters, 2026-09-26)
  "en:6:0": 0xf0d4bea1, // 2965 words, 8.1 years (six letters, 2026-09-26)
};

describe("the daily words' pools", () => {
  it("are each exactly as published", () => {
    for (const [name, entry] of ENTRIES) {
      expect(PINS[name], `a new pool: pin it with  "${name}": 0x${hashOf(entry).toString(16)},`).toBeDefined();
      expect(hashOf(entry), `${name} was edited after it was published`).toBe(PINS[name]);
    }
    expect(Object.keys(PINS).sort(), "a pin for a pool that is not there").toEqual(ENTRIES.map(([name]) => name).sort());
  });

  it("have a pool at every length each Gomoji offers, so a new length has its daily word from the day it ships", () => {
    for (const kind of WORD_KINDS) {
      // Every size its set-up offers, both shelves of a shelved one (`sizesOffered`).
      expect(dailyLengths(kind), `${kind}: run node scripts/daily-pools.ts for the missing lengths`).toEqual([...sizesOffered(kind)].sort((a, b) => a - b));
    }
  });

  it("hold words of their length and nothing twice", () => {
    for (const kind of WORD_KINDS) {
      for (const size of dailyLengths(kind)) {
        for (const pool of dailyPoolsOf(kind, size)!) {
          expect(new Set(pool.words).size, `${kind} ${size}`).toBe(pool.words.length);
          expect(pool.words.every((word) => [...word].length === size), `${kind} ${size}`).toBe(true);
        }
      }
    }
  });

  it("were taken from the answers the puzzles are drawn from at medium and hard", () => {
    for (const kind of WORD_KINDS) {
      for (const size of dailyLengths(kind)) {
        const answers = new Set(kind === "gomojiKana" ? kanaWordsOf(size).answers : answersFor(size, false, dailyLanguageOf(kind) as "en" | "fr" | "de"));
        const first = dailyPoolsOf(kind, size)!.find((pool) => pool.fromCycle === 0)!;
        // Every word was an answer when frozen; a later list may drop one, which is why the pool is frozen at all.
        const kept = first.words.filter((word) => answers.has(word)).length;
        expect(kept / first.words.length, `${kind} ${size}`).toBeGreaterThan(0.9);
      }
    }
  });
});

describe("a day's puzzle", () => {
  const day = dayAfter(DAILY_WORDS_EPOCH, 30);

  it("hides the day's word at every level, so everybody meets the same one", () => {
    for (const kind of WORD_KINDS) {
      for (const size of dailyLengths(kind)) {
        const word = dailyWordOf(kind, size, day)!.word;
        for (const level of PUZZLE_SPECS[kind].levels) {
          const puzzle = generatePuzzle(kind, size, level, dailyWordSeed(day));
          expect(puzzle.solution, `${kind} ${size} ${level}`).toBe(word);
        }
      }
    }
  });

  it("gives each length its own word, and tomorrow another", () => {
    for (const kind of WORD_KINDS) {
      const today = dailyLengths(kind).map((size) => dailyWordOf(kind, size, day)!.word);
      expect(new Set(today).size).toBe(today.length);
      for (const size of dailyLengths(kind)) expect(dailyWordOf(kind, size, dayAfter(day))!.word).not.toBe(dailyWordOf(kind, size, day)!.word);
    }
  });

  it("is solved by guessing the word, which the server's check accepts", () => {
    for (const kind of WORD_KINDS) {
      const size = dailyLengths(kind)[0]!;
      const level = PUZZLE_SPECS[kind].defaultLevel;
      const puzzle = generatePuzzle(kind, size, level, dailyWordSeed(day));
      expect(checkSolution(kind, size, puzzle.givens, puzzle.solution, level), kind).toEqual({ ok: true });
    }
  });

  it("takes its own word as a guess even when the live list does not have it, and no other word so", () => {
    const [word] = dailyPoolsOf("gomoji", 5)![0]!.words;
    expect(isDailyPoolWord("en", 5, word!)).toBe(true);
    expect(isDailyPoolWord("en", 5, "zzzzz")).toBe(false);
    expect(checkSolution("gomoji", 5, "ZZZZZ", "zzzzz", "medium").ok).toBe(false);
  });

  it("draws the word as always for a seed that names no day", () => {
    const before = generatePuzzle("gomoji", 5, "medium", 424_242);
    expect(generatePuzzle("gomoji", 5, "medium", 424_242)).toEqual(before);
    expect(dailyWordOf("gomoji", 5, dayAfter(DAILY_WORDS_EPOCH, -1))).toBeNull();
  });
});
