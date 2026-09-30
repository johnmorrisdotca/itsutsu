import { beforeAll, describe, expect, it } from "vitest";

import { checkKumimoji } from "./check.ts";
import { generateKumimoji } from "./generate.ts";
import { judgeGrid, runsOf, squareAt } from "./grid.ts";
import { judgeWithWords } from "./judge.ts";
import type { KumimojiLanguage } from "./kumimoji.types.ts";
import { KUMIMOJI_BAG, KUMIMOJI_HANDS } from "./tiles.constants.ts";
import { loadTileWords, tileWords } from "./tileWords.ts";

/**
 * DIAGONALS, the set-up choice that reads a crossword corner to corner as
 * well: every diagonal run of three or more tiles, down to the right or down
 * to the left, must be a word, and joins its tiles; a pair touching at a
 * corner is not read and joins nothing.
 */

beforeAll(async () => {
  await loadTileWords("english");
  await loadTileWords("japanese");
});

const isWord = (word: string) => tileWords().allowed.has(word);
const DIAGONALS = { diagonals: true } as const;

/** A grid from rows of text, "." for an empty square, its first row and column at 0. */
function gridOf(...rows: string[]): Map<string, string> {
  const tiles = new Map<string, string>();
  rows.forEach((line, row) => [...line].forEach((letter, col) => letter !== "." && tiles.set(squareAt(row, col), letter)));
  return tiles;
}

describe("reading the diagonals", () => {
  it("reads runs of three or more both ways, top to bottom, only when asked", () => {
    const right = gridOf("c..", ".a.", "..t");
    expect(runsOf(right)).toEqual([]);
    expect(runsOf(right, DIAGONALS)).toEqual([{ word: "cat", squares: [squareAt(0, 0), squareAt(1, 1), squareAt(2, 2)], line: "downRight" }]);
    const left = gridOf("..d", ".o.", "g..");
    expect(runsOf(left, DIAGONALS)).toEqual([{ word: "dog", squares: [squareAt(0, 2), squareAt(1, 1), squareAt(2, 0)], line: "downLeft" }]);
  });

  it("leaves a pair touching at a corner unread", () => {
    expect(runsOf(gridOf("ca.", ".at"), DIAGONALS).filter((run) => run.line === "downRight" || run.line === "downLeft")).toEqual([]);
  });

  it("judges a diagonal word sound, and joins its tiles, with Diagonals on", () => {
    const verdict = judgeGrid(gridOf("c..", ".a.", "..t"), isWord, undefined, DIAGONALS);
    expect(verdict).toMatchObject({ sound: true, notWords: [] });
    expect(verdict.apart.size).toBe(0);
  });

  it("reads nothing along the diagonals with the option off: the same tiles are three apart", () => {
    const verdict = judgeGrid(gridOf("c..", ".x.", "..t"), isWord);
    expect(verdict.misspelt.size).toBe(0);
    expect(verdict.notWords).toEqual([]);
    expect(verdict.sound).toBe(false);
    expect(verdict.apart.size).toBe(2);
  });

  it("marks a misspelt diagonal, names it, and still joins it", () => {
    const verdict = judgeGrid(gridOf("c..", ".x.", "..t"), isWord, undefined, DIAGONALS);
    expect(verdict.sound).toBe(false);
    expect(verdict.notWords).toEqual(["cxt"]);
    expect([...verdict.misspelt].sort()).toEqual([squareAt(0, 0), squareAt(1, 1), squareAt(2, 2)]);
    expect(verdict.apart.size).toBe(0);
  });

  it("reads a Japanese diagonal as the word its kana spell", () => {
    const words = tileWords("japanese");
    const [a, su, ko] = ["あ", "そ", "こ"].map((kana) => words.codeOf(kana)!);
    const tiles = new Map([
      [squareAt(0, 2), a!],
      [squareAt(1, 1), su!],
      [squareAt(2, 0), ko!],
    ]);
    expect(judgeWithWords(tiles, words, DIAGONALS)).toMatchObject({ sound: true, notWords: [] });
    expect(judgeWithWords(tiles, words).sound).toBe(false);
  });
});

describe("the server's check with Diagonals", () => {
  it("takes a crossword joined only along a diagonal word, and refuses it without Diagonals", () => {
    // CAT down to the right, and TOW across from its T.
    expect(checkKumimoji(3, "tacwo", "c/1a/2tow", DIAGONALS)).toEqual({ ok: true });
    expect(checkKumimoji(3, "tacwo", "c/1a/2tow")).toEqual({ ok: false, reason: "the tiles are not all joined" });
  });

  it("refuses a crossword whose diagonal is not a word, which is sound without Diagonals", () => {
    // AT, TO, OR and RE, a staircase whose diagonal reads A·O·E.
    expect(checkKumimoji(3, "atore", "at/1or/2e")).toEqual({ ok: true });
    expect(checkKumimoji(3, "atore", "at/1or/2e", DIAGONALS)).toEqual({ ok: false, reason: "aoe is not in the word list" });
  });

  it("takes an ordinary crossword with no diagonal of three either way", () => {
    expect(checkKumimoji(3, "tacwo", "cat/o/w", DIAGONALS)).toEqual({ ok: true });
  });
});

describe("making a kumimoji with Diagonals", () => {
  const languages: KumimojiLanguage[] = ["english", "japanese"];
  for (const language of languages) {
    it.each(Object.values(KUMIMOJI_HANDS))(`lays every ${language} bag at hand %i as a crossword sound along its diagonals too, in a browser's time`, (size) => {
      for (const seed of [1, 2, 3, 77, 20260928]) {
        const started = performance.now();
        const puzzle = generateKumimoji(size, "medium", seed, { language, diagonals: true });
        const took = performance.now() - started;
        expect(puzzle.diagonals).toBe(true);
        expect(puzzle.givens).toHaveLength(language === "english" ? KUMIMOJI_BAG[size]! : puzzle.givens.length);
        expect(checkKumimoji(size, puzzle.givens, puzzle.solution, { level: "medium", language, diagonals: true }), `seed ${seed}`).toEqual({ ok: true });
        expect(took, `seed ${seed} took ${Math.round(took)} ms`).toBeLessThan(3000);
      }
    });
  }

  it.each([
    ["an English full Double set", { gameLength: "full", doubleSet: true, language: "english" }],
    ["a Japanese full set", { gameLength: "full", language: "japanese" }],
  ] as const)("lays and independently checks %s with Diagonals", (_, options) => {
    const started = performance.now();
    const puzzle = generateKumimoji(7, "medium", 20260928, { ...options, diagonals: true });
    expect(checkKumimoji(7, puzzle.givens, puzzle.solution, { level: "medium", ...options, diagonals: true })).toEqual({ ok: true });
    /*
     * Measured at two seconds or under alone. The gate runs the unit suite beside
     * the lint and the build, where the Double set once took 8.5 s; the bound is
     * here to catch a search that runs for minutes, not a busy machine.
     */
    expect(performance.now() - started).toBeLessThan(20_000);
  });

  it("deals the same bag it always dealt with Diagonals off", () => {
    const off = generateKumimoji(11, "medium", 20260928);
    expect(off.diagonals).toBeUndefined();
    expect(generateKumimoji(11, "medium", 20260928, { diagonals: false })).toEqual(off);
  });
});
