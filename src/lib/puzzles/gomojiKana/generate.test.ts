import { beforeAll, describe, expect, it } from "vitest";

import { generatePuzzle, prepareEveryPuzzle } from "../generate";
import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { foundBonus } from "../gomoji/wordScore";
import { pointsFor } from "../puzzlePoints";
import { decodeKanaGivens, KANA_ROWS } from "./kanaCode";
import { markKanaGuess } from "./kanaMarks";
import { kanaWordsOf } from "./kanaWords";

beforeAll(prepareEveryPuzzle);

describe("gomojiKana, made and checked", () => {
  it("opens easy and medium with a grey word, and hard with none", () => {
    for (const level of ["easy", "medium"] as const) {
      const made = decodeKanaGivens(generatePuzzle("gomojiKana", 4, level, 11).givens, 4)!;
      expect(made.grey).not.toBeNull();
      expect(markKanaGuess([...made.grey!], [...made.word]).every((each) => each.mark === "miss")).toBe(true);
    }
    expect(decodeKanaGivens(generatePuzzle("gomojiKana", 4, "hard", 11).givens, 4)!.grey).toBeNull();
  });

  it("accepts the word found last, and a loss only when every row hard gives is a word and none is the word", () => {
    const made = generatePuzzle("gomojiKana", 3, "hard", 21);
    const others = [...kanaWordsOf(3).allowed].filter((word) => word !== made.solution).slice(0, KANA_ROWS);
    expect(checkSolution("gomojiKana", 3, made.givens, others[0]! + made.solution, "hard")).toEqual({ ok: true });
    expect(checkSolution("gomojiKana", 3, made.givens, made.solution + others[0]!, "hard").ok).toBe(false);
    expect(checkOutOfGuesses("gomojiKana", 3, made.givens, others.join(""), "hard")).toEqual({ ok: true });
    expect(checkOutOfGuesses("gomojiKana", 3, made.givens, others.slice(0, 5).join(""), "hard").ok).toBe(false);
    expect(checkSolution("gomojiKana", 3, made.givens, "ぬぬぬ", "hard").ok).toBe(false);
  });

  it("scores a loss for what it found and a win on top of every place", () => {
    const made = generatePuzzle("gomojiKana", 3, "medium", 5);
    // Medium's three kana: a free word and seven guesses (`layout.ts`), found on the first.
    expect(pointsFor("gomojiKana", 3, made.givens, 0, 0, made.solution, 10_000, "medium")).toBe(3 * 10 * 7 + foundBonus(3, 7) + 25 * 6 + 50);
  });
});
