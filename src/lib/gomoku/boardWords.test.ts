import { describe, expect, it } from "vitest";

import { boardPhrase, boardWords } from "./boardWords";
import { RULE_VARIANT_LIST, VARIANT_SPECS, boardSizesFor } from "./gomoku.constants";

/**
 * THE BOARD SAID HONESTLY, which for three of the games is not "N×N".
 *
 * The test that matters is the last one: every game, on every board it is
 * offered, and the only thing asserted is that a square says its two sides
 * and a game embedded in a square array never does. A game added later is
 * covered the day it is added.
 */
describe("boardWords", () => {
  it("says the two sides of a square board", () => {
    expect(boardWords("reversi", 8)).toBe("8×8");
    expect(boardWords("freestyle", 15)).toBe("15×15");
    expect(boardPhrase("reversi", 8)).toBe("an 8×8 board");
    expect(boardPhrase("freestyle", 15)).toBe("a 15×15 board");
  });

  it("says the cells of a board that is not a square", () => {
    // The hexagon is the game's real shape; the 11 is the array it sits in.
    expect(boardWords("honeycomb", 11)).toBe("91 cells");
    expect(boardWords("honeycomb", 7)).toBe("37 cells");
    expect(boardWords("honeycomb", 9)).toBe("61 cells");
    expect(boardWords("honeycomb", 13)).toBe("127 cells");
    expect(boardPhrase("honeycomb", 11)).toBe("a hexagon of 91 cells");
    // The hexagram, counted rather than quoted from its own comment.
    expect(boardWords("chineseCheckers", 17)).toBe("121 cells");
    expect(boardPhrase("chineseCheckers", 17)).toBe("a hexagram of 121 cells");
  });

  it("answers for a name this build does not know, as the square it would have drawn", () => {
    // Several callers hold a variant read out of a stored row, typed as a string.
    expect(boardWords("a-game-from-another-version", 13)).toBe("13×13");
    expect(boardPhrase("a-game-from-another-version", 13)).toBe("a 13×13 board");
  });

  it("never prints N×N for a game that is not played on a square", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const spec = VARIANT_SPECS[variant];
      const square = !spec.hexagon && !spec.chineseCheckers;
      for (const size of boardSizesFor(variant)) {
        const words = boardWords(variant, size);
        if (square) {
          expect(words, `${variant} at ${size}`).toBe(`${size}×${size}`);
        } else {
          expect(words, `${variant} at ${size} must not claim a square`).not.toContain("×");
          expect(words, `${variant} at ${size} counts its cells`).toMatch(/^\d+ cells$/);
        }
        // And the sentence form names the shape rather than repeating the chip.
        expect(boardPhrase(variant, size).length, `${variant} at ${size}`).toBeGreaterThan(words.length);
      }
    }
  });
});
