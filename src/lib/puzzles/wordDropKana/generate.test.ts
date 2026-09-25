import { beforeAll, describe, expect, it } from "vitest";

import { generatePuzzle, prepareEveryPuzzle } from "../generate";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { pointsFor } from "../puzzlePoints";
import { decodeKanaGivens, KANA_ROWS } from "./kanaCode";
import { markKanaGuess } from "./kanaMarks";
import { kanaWordsOf } from "./kanaWords";

beforeAll(prepareEveryPuzzle);

describe("wordDropKana, made and checked", () => {
  it("opens easy and medium with a grey word, and hard with none", () => {
    for (const level of ["easy", "medium"] as const) {
      const made = decodeKanaGivens(generatePuzzle("wordDropKana", 4, level, 11).givens, 4)!;
      expect(made.grey).not.toBeNull();
      expect(markKanaGuess([...made.grey!], [...made.word]).every((each) => each.mark === "miss")).toBe(true);
    }
    expect(decodeKanaGivens(generatePuzzle("wordDropKana", 4, "hard", 11).givens, 4)!.grey).toBeNull();
  });

  it("accepts the word found last, and a loss only when all six rows are words and none is the word", () => {
    const made = generatePuzzle("wordDropKana", 3, "easy", 21);
    const others = [...kanaWordsOf(3).allowed].filter((word) => word !== made.solution).slice(0, KANA_ROWS);
    expect(checkSolution("wordDropKana", 3, made.givens, others[0]! + made.solution)).toEqual({ ok: true });
    expect(checkSolution("wordDropKana", 3, made.givens, made.solution + others[0]!).ok).toBe(false);
    expect(checkOutOfGuesses("wordDropKana", 3, made.givens, others.join(""))).toEqual({ ok: true });
    expect(checkOutOfGuesses("wordDropKana", 3, made.givens, others.slice(0, 5).join("")).ok).toBe(false);
    expect(checkSolution("wordDropKana", 3, made.givens, "ぬぬぬ").ok).toBe(false);
  });

  it("scores a loss for what it found and a win on top of every place", () => {
    const made = generatePuzzle("wordDropKana", 3, "medium", 5);
    expect(pointsFor("wordDropKana", 3, made.givens, 0, 0, made.solution, 10_000)).toBe(3 * 10 * 6 + 250 + 25 * 5 + 50);
  });
});
