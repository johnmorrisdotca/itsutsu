import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameState, Point, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { turnChoices } from "@/lib/gomoku/rules/choices";
import { FEW_LEGAL_MOVES, SQUARE_GUIDES } from "./Board.constants";
import { squareLabel } from "./squareLabel";
import { squareGuide, turnGuide, turnGuideWords } from "./turnGuide";

const p = (row: number, col: number): Point => ({ row, col });

function position(variant: RuleVariant, pieces: { at: Point; stone: Stone; king?: boolean }[], toPlay: Stone): GameState {
  const game = createGame({ variant });
  const { size } = game.settings;
  const board = new Array(size * size).fill(null);
  for (const piece of pieces) board[piece.at.row * size + piece.at.col] = piece.stone;
  return { ...game, board, kings: pieces.filter((piece) => piece.king === true).map((piece) => piece.at), toPlay };
}

const guideOf = (state: GameState) => turnGuide(state, turnChoices(state));

describe("the turn guide", () => {
  it("marks only a move or two, as its named limit says", () => {
    expect(FEW_LEGAL_MOVES).toBe(2);
  });

  it("marks a forced capture in checkers, dims the man held back, and says why on screen", () => {
    const state = position(
      RULE_VARIANTS.checkers,
      [
        { at: p(3, 2), stone: STONES.black },
        { at: p(4, 3), stone: STONES.white },
        { at: p(2, 5), stone: STONES.black },
      ],
      STONES.black,
    );
    const guide = guideOf(state);
    expect(guide).not.toBeNull();
    const at = (index: number) => squareGuide(guide, index, state.board[index]);
    expect(at(3 * 8 + 2)).toBe(SQUARE_GUIDES.choice);
    expect(at(2 * 8 + 5)).toBe(SQUARE_GUIDES.unavailable);
    // The other side's piece is neither: the guide is about the mover's own turn.
    expect(at(4 * 8 + 3)).toBeNull();
    expect(turnGuideWords(guide!, 8)).toEqual({ shown: "You must capture.", spoken: "The piece that may move: C5." });
  });

  it("says the longest capture is why in internationalDraughts", () => {
    const state = position(
      RULE_VARIANTS.internationalDraughts,
      [
        { at: p(6, 9), stone: STONES.white },
        { at: p(5, 8), stone: STONES.black, king: true },
        { at: p(8, 1), stone: STONES.white },
        { at: p(7, 2), stone: STONES.black },
        { at: p(5, 4), stone: STONES.black },
      ],
      STONES.white,
    );
    const guide = guideOf(state);
    expect(turnGuideWords(guide!, 10).shown).toBe("You must take the most pieces.");
    expect(squareGuide(guide, 6 * 10 + 9, state.board[6 * 10 + 9])).toBe(SQUARE_GUIDES.unavailable);
  });

  it("shows nothing at the start of checkers, where seven moves are narrowed by nothing", () => {
    expect(guideOf(createGame({ variant: RULE_VARIANTS.checkers }))).toBeNull();
  });

  it("marks reversi's two legal points, veils the other empty ones, leaves the stones be, and names the moves for a screen reader only", () => {
    const state = position(
      RULE_VARIANTS.reversi,
      [
        { at: p(0, 0), stone: STONES.black },
        { at: p(0, 1), stone: STONES.white },
        { at: p(1, 0), stone: STONES.white },
      ],
      STONES.black,
    );
    const guide = guideOf(state);
    const at = (index: number) => squareGuide(guide, index, state.board[index]);
    expect(at(2)).toBe(SQUARE_GUIDES.choice);
    expect(at(2 * 8)).toBe(SQUARE_GUIDES.choice);
    expect(at(5 * 8 + 5)).toBe(SQUARE_GUIDES.veiled);
    // A disc is never a move, and never veiled: a veiled black disc read as grey.
    expect(at(0)).toBeNull();
    expect(at(1)).toBeNull();
    expect(turnGuideWords(guide!, 8)).toEqual({ shown: null, spoken: "Only 2 moves: C8 and A6." });

    const one = position(
      RULE_VARIANTS.reversi,
      [
        { at: p(0, 0), stone: STONES.black },
        { at: p(0, 1), stone: STONES.white },
      ],
      STONES.black,
    );
    expect(turnGuideWords(guideOf(one)!, 8).spoken).toBe("Only one move: C8.");
  });

  it("shows nothing on a gomoku board with every point open", () => {
    expect(guideOf(createGame({ variant: RULE_VARIANTS.freestyle, size: 15 }))).toBeNull();
    expect(squareGuide(null, 0, null)).toBeNull();
  });
});

describe("what a square is called", () => {
  it("names a crowned piece a king, and every other stone a stone", () => {
    expect(squareLabel(8, p(0, 1), STONES.black, { forbidden: false, king: true })).toBe("B8, Black king");
    expect(squareLabel(8, p(0, 1), STONES.white, { forbidden: false, king: false })).toBe("B8, White stone");
    expect(squareLabel(15, p(7, 7), null, { forbidden: false, king: false })).toBe("H8, empty");
    expect(squareLabel(15, p(7, 7), null, { forbidden: true, king: false })).toBe("H8, forbidden");
  });
});
