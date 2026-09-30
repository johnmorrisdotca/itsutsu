import { beforeAll, describe, expect, it } from "vitest";

import { squareAt } from "./grid.ts";
import { judgeWithWords } from "./judge.ts";
import { kanaTileCode } from "./tileFace.ts";
import { loadTileWords, tileWords } from "./tileWords.ts";
import { readWilds } from "./wilds.ts";

/**
 * A WILD LAID WITHOUT A LETTER: John laid D, a blank wild, O, N, E and was
 * told "Not a word: D*ONE". A blank reads as whatever letter makes every run
 * through it a word, and only where none does is the run named as laid.
 */

beforeAll(async () => {
  await loadTileWords("english");
  await loadTileWords("japanese");
});

/** A grid from rows of text, "." for an empty square, its first row and column at 0. */
function gridOf(...rows: string[]): Map<string, string> {
  const tiles = new Map<string, string>();
  rows.forEach((line, row) => [...line].forEach((letter, col) => letter !== "." && tiles.set(squareAt(row, col), letter)));
  return tiles;
}

describe("a wild with no letter", () => {
  it("takes the letter that makes its word: D*ONE is DRONE", () => {
    const words = tileWords();
    const laid = gridOf("d*one");
    const verdict = judgeWithWords(laid, words);
    expect(verdict.notWords).toEqual([]);
    expect(verdict.sound).toBe(true);
    const read = readWilds(laid, words)!;
    expect(words.wordOf([...read.values()].join(""))).toBe("drone");
    // The grid it was given is left as laid.
    expect(laid.get(squareAt(0, 1))).toBe("*");
  });

  it("reads John's own table: GIN down onto the N of D*ONE", () => {
    const verdict = judgeWithWords(gridOf("...g.", "...i.", "d*one"), tileWords());
    expect(verdict.notWords).toEqual([]);
    expect(verdict.sound).toBe(true);
  });

  it("takes one letter for both of its runs where it stands at a crossing", () => {
    const words = tileWords();
    // Across C?T, down ?X: A or O fits both, U only the first.
    expect(words.allowed.has("cut") && !words.allowed.has("ux")).toBe(true);
    const read = readWilds(gridOf("c*t", ".x."), words)!;
    const letter = words.soundOf(read.get(squareAt(0, 1))!)!;
    expect(words.allowed.has(`c${letter}t`) && words.allowed.has(`${letter}x`)).toBe(true);
    expect(judgeWithWords(gridOf("c*t", ".x."), words).sound).toBe(true);
  });

  it("finds two blanks in one word together", () => {
    const verdict = judgeWithWords(gridOf("d**ne"), tileWords());
    expect(verdict.notWords).toEqual([]);
  });

  it("still names a run no letter can make a word, as it was laid", () => {
    const words = tileWords();
    expect(readWilds(gridOf("qzx*"), words)).toBeNull();
    const verdict = judgeWithWords(gridOf("qzx*"), words);
    expect(verdict.sound).toBe(false);
    expect(verdict.notWords).toEqual(["qzx*"]);
  });

  it("keeps a wild given a letter to that letter", () => {
    const words = tileWords();
    const verdict = judgeWithWords(gridOf(`d${words.wildFor("x")}one`), words);
    expect(verdict.sound).toBe(false);
    expect(verdict.notWords).toEqual(["dxone"]);
  });

  it("reads a blank as a kana in a Japanese grid", () => {
    const words = tileWords("japanese");
    const [first, second] = [...[...words.allowed].find((word) => [...word].length === 2 && [...word].every((kana) => kanaTileCode(kana) !== null))!];
    const tiles = new Map([[squareAt(0, 0), kanaTileCode(first!)!], [squareAt(0, 1), "*"]]);
    const verdict = judgeWithWords(tiles, words);
    expect(verdict.sound).toBe(true);
    expect(second).toBeDefined();
  });
});
