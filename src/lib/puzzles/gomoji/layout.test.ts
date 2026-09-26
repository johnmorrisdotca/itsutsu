import { describe, expect, it } from "vitest";

import { PUZZLE_SPECS } from "../puzzles.constants";
import { LEAST_SPAN, LONGEST_WORD, MOST_GUESSES, boardSpan, gomojiLayout, playPlace } from "./layout";

describe("a Gomoji board", () => {
  it("is at least eight squares, the same board for four letters or kana, and odd for an odd word", () => {
    expect(gomojiLayout("gomoji", 4, "easy", 0).span).toBe(8);
    expect(gomojiLayout("gomoji", 5, "easy", 0).span).toBe(9);
    expect(gomojiLayout("gomoji", 6, "easy", 0).span).toBe(8);
    expect(gomojiLayout("gomojiKana", 3, "hard", 0).span).toBe(9);
    expect(gomojiLayout("gomojiKana", 4, "easy", 1).span).toBe(8);
    expect(gomojiLayout("gomojiKana", 5, "easy", 1).span).toBe(9);
  });

  it("gives easy every row, medium one more than the published game, hard the published count", () => {
    expect(gomojiLayout("gomoji", 5, "easy", 0).guesses).toBe(9);
    expect(gomojiLayout("gomoji", 5, "medium", 0).guesses).toBe(7);
    expect(gomojiLayout("gomoji", 5, "hard", 0).guesses).toBe(6);
    expect(gomojiLayout("gomojiKana", 4, "easy", 1).guesses).toBe(7);
    // Six letters stop at the published six for hard (`baseGuesses`): seven, medium eight and easy eight would leave nothing between easy and medium.
    expect(gomojiLayout("gomoji", 6, "easy", 0).guesses).toBe(8);
    expect(gomojiLayout("gomoji", 6, "medium", 0).guesses).toBe(7);
    expect(gomojiLayout("gomoji", 6, "hard", 0).guesses).toBe(6);
    expect(gomojiLayout("gomojiKana", 4, "medium", 1).guesses).toBe(7);
    expect(gomojiLayout("gomojiKana", 5, "hard", 0).guesses).toBe(6);
  });

  it("keeps play inside the board, centred across and lower rather than against the top", () => {
    for (const kind of ["gomoji", "gomojiKana"] as const) {
      for (const size of PUZZLE_SPECS[kind].sizes) {
        for (const level of PUZZLE_SPECS[kind].levels) {
          for (const free of kind === "gomojiKana" && level !== "hard" ? [1] : [0]) {
            const layout = gomojiLayout(kind, size, level, free);
            expect(layout.span).toBeGreaterThanOrEqual(LEAST_SPAN);
            expect(Number.isInteger(layout.left)).toBe(true);
            expect(layout.top + layout.free + layout.guesses).toBeLessThanOrEqual(layout.span);
            expect(layout.top, `${kind} ${size} ${level}: the spare rows below outnumber those above`).toBeGreaterThanOrEqual(layout.span - layout.top - layout.free - layout.guesses);
            expect(layout.guesses).toBeLessThanOrEqual(MOST_GUESSES);
            expect(size).toBeLessThanOrEqual(LONGEST_WORD);
            // The grid, which knows only the rows it draws, puts them in the same place.
            const { span, top, left } = layout;
            expect(playPlace(size, layout.free + layout.guesses)).toEqual({ span, top, left });
          }
        }
      }
    }
  });

  it("centres an odd word on an odd board", () => {
    expect(boardSpan(5, 8)).toBe(9);
    expect(boardSpan(4, 8)).toBe(8);
    for (const [size, rows] of [[5, 6], [4, 5], [3, 7], [3, 6], [4, 7], [4, 6], [5, 7]] as const) {
      const span = boardSpan(size, rows);
      expect(span).toBeGreaterThanOrEqual(rows);
      expect((span - size) % 2, `${size} across ${rows} rows on ${span}`).toBe(0);
      expect(span - Math.max(size, rows)).toBeLessThanOrEqual(1);
    }
  });
});
