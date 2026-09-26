import { beforeAll, describe, expect, it } from "vitest";

import { generatePuzzle, prepareEveryPuzzle } from "../generate";
import { decodeKanaGivens } from "../gomojiKana/kanaCode";
import { kanaBase } from "../gomojiKana/kanaMarks";
import { withHeadStart } from "../keyMarks";
import { checkSolution } from "../puzzleCheck";
import { POINTS_A_HELP, pointsFor } from "../puzzlePoints";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { decodeHidden, languageOf } from "./code";
import { HEAD_START_HINTS, HEAD_START_RANKS, drawHeadStart, hadHeadStart, headStartKeys, hintsWords, offersHeadStart } from "./headStart";
import { KEYBOARD_ROWS } from "./keyboardRows";

beforeAll(prepareEveryPuzzle);

const LETTERED = ["gomoji", "gomojiMot", "gomojiWort"] as const;
const SEEDS = Array.from({ length: 60 }, (_, at) => 1 + at * 7919);

describe("Gomoji's Head start", () => {
  it("is offered for the four Gomojis at easy, and nowhere else", () => {
    for (const kind of PUZZLE_KIND_LIST) {
      const words = PUZZLE_SPECS[kind].wordGrid !== undefined;
      expect(offersHeadStart(kind, "easy"), kind).toBe(words);
      expect(offersHeadStart(kind, "medium"), kind).toBe(false);
      expect(offersHeadStart(kind, "hard"), kind).toBe(false);
    }
  });

  it("greys as many keys as the word has letters, all on the keyboard, none of them in the word", () => {
    for (const kind of LETTERED) {
      const keyboard = KEYBOARD_ROWS[languageOf(kind)].join("");
      for (const size of PUZZLE_SPECS[kind].offered) {
        for (const seed of SEEDS) {
          const { givens } = generatePuzzle(kind, size, "easy", seed);
          const hidden = decodeHidden(givens, size, languageOf(kind))!;
          const keys = headStartKeys(kind, size, givens);
          expect(keys, `${kind} ${size} ${seed}`).toHaveLength(size);
          expect(new Set(keys).size).toBe(size);
          for (const key of keys) {
            expect(hidden.includes(key), `${key} in ${hidden}`).toBe(false);
            expect(keyboard.includes(key), `${key} on the ${kind} keyboard`).toBe(true);
          }
        }
      }
    }
  });

  it("greys as many kana keys as the word is long, none the word's nor the free grey word's", () => {
    for (const size of PUZZLE_SPECS.gomojiKana.offered) {
      for (const seed of SEEDS) {
        const { givens } = generatePuzzle("gomojiKana", size, "easy", seed);
        const given = decodeKanaGivens(givens, size)!;
        const out = new Set([...given.word, ...(given.grey ?? "")].map(kanaBase));
        const keys = headStartKeys("gomojiKana", size, givens);
        expect(keys, `${size} ${seed}`).toHaveLength(size);
        expect(new Set(keys).size).toBe(size);
        for (const key of keys) {
          expect(out.has(key), `${key} against ${given.word} and ${given.grey}`).toBe(false);
          expect(kanaBase(key)).toBe(key);
        }
      }
    }
  });

  it("is the same head start for the same puzzle, and not the same for every puzzle", () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const { givens } = generatePuzzle("gomoji", 5, "easy", seed);
      expect(headStartKeys("gomoji", 5, givens)).toEqual(headStartKeys("gomoji", 5, givens));
      seen.add([...headStartKeys("gomoji", 5, givens)].sort().join(""));
    }
    expect(seen.size).toBeGreaterThan(SEEDS.length / 2);
  });

  it("draws from the commonest letters not in the word, twice as many as it greys", () => {
    for (const seed of SEEDS) {
      const { givens } = generatePuzzle("gomoji", 5, "easy", seed);
      const hidden = decodeHidden(givens, 5)!;
      const pool = [...HEAD_START_RANKS.en].filter((letter) => !hidden.includes(letter)).slice(0, 10);
      for (const key of headStartKeys("gomoji", 5, givens)) expect(pool).toContain(key);
    }
  });

  it("never hands out an excluded key, and hands out fewer only when fewer are left", () => {
    expect(drawHeadStart("abc", "abcd", new Set(["a", "b"]), 5, "X")).toEqual(expect.arrayContaining(["c", "d"]));
    expect(drawHeadStart("abc", "abcd", new Set(["a", "b"]), 5, "X")).toHaveLength(2);
    expect(headStartKeys("gomoji", 5, "not givens")).toEqual([]);
  });

  it("changes nothing the server checks: the solve is the same solve with or without it", () => {
    const made = generatePuzzle("gomoji", 5, "easy", 42);
    expect(checkSolution("gomoji", 5, made.givens, made.solution, "easy")).toEqual({ ok: true });
  });

  it("costs one help's points, never below nought, and is told apart from a Hint by the puzzle", () => {
    const made = generatePuzzle("gomoji", 5, "easy", 42);
    const plain = pointsFor("gomoji", 5, made.givens, 0, 0, made.solution, 30_000, "easy");
    expect(pointsFor("gomoji", 5, made.givens, 0, HEAD_START_HINTS, made.solution, 30_000, "easy")).toBe(plain - POINTS_A_HELP);
    // A word never found and barely touched scores little; a head start takes it to nought, not under.
    const miss = [...HEAD_START_RANKS.en].filter((letter) => !made.solution.includes(letter)).slice(0, 5).join("");
    expect(pointsFor("gomoji", 5, made.givens, 0, HEAD_START_HINTS, miss, 30_000, "easy")).toBe(0);
    expect(hadHeadStart("gomoji", "easy", HEAD_START_HINTS)).toBe(true);
    expect(hadHeadStart("gomoji", "easy", true)).toBe(true);
    expect(hadHeadStart("gomoji", "easy", 0)).toBe(false);
    expect(hadHeadStart("numberPlace", "easy", 1)).toBe(false);
    expect(hintsWords("gomojiKana", "easy", 1)).toBe("Head start");
    expect(hintsWords("numberPlace", "easy", 1)).toBe("1 hint");
    expect(hintsWords("numberPlace", "hard", 3)).toBe("3 hints");
    expect(hintsWords("gomoji", "easy", 0)).toBeNull();
  });

  it("greys a key the guesses have not marked, and leaves a better mark as it was", () => {
    const known = new Map([["a", "kin" as const]]);
    const out = withHeadStart<"kin" | "miss">(known, ["a", "b"], "miss");
    expect(out.get("a")).toBe("kin");
    expect(out.get("b")).toBe("miss");
    expect(known.has("b")).toBe(false);
  });
});
