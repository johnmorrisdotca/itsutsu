import { describe, expect, it } from "vitest";
import { createGame, playMove } from "./engine";
import { RULE_VARIANTS, STONES } from "./gomoku.constants";
import type { GameState, Point } from "./gomoku.types";
import { reviewAcrossVariants } from "./review";

const p = (row: number, col: number): Point => ({ row, col });

function play(state: GameState, points: Point[]): GameState {
  return points.reduce((current, point) => playMove(current, point), state);
}

describe("reviewAcrossVariants", () => {
  it("says nothing about an empty game", () => {
    expect(reviewAcrossVariants(createGame())).toEqual([]);
  });

  it("notes a double three that renju and omok would have refused", () => {
    // Black: 4,2 4,3 then 2,4 3,4, then 4,4 — two open threes at once.
    const game = play(createGame({ size: 9 }), [
      p(4, 2), p(0, 0),
      p(4, 3), p(0, 1),
      p(2, 4), p(0, 2),
      p(3, 4), p(0, 3),
      p(4, 4),
    ]);
    const notes = reviewAcrossVariants(game);
    const forbidden = notes.filter((note) => note.kind === "forbiddenElsewhere");

    expect(forbidden.map((note) => note.variant).sort()).toEqual(
      [RULE_VARIANTS.omok, RULE_VARIANTS.renju].sort(),
    );
    expect(forbidden[0]).toMatchObject({
      moveNumber: 9,
      stone: STONES.black,
      pattern: "doubleThree",
    });
  });

  it("notes that an overline win would not have counted in standard", () => {
    const game = play(createGame({ size: 9 }), [
      p(4, 1), p(0, 0),
      p(4, 2), p(0, 2),
      p(4, 4), p(0, 4),
      p(4, 5), p(0, 6),
      p(4, 6), p(1, 1),
      p(4, 3),
    ]);
    expect(game.status).toBe("won");
    expect(game.winner).toBe(STONES.black);

    const notes = reviewAcrossVariants(game);
    const standard = notes.find((note) => note.variant === RULE_VARIANTS.standard);
    expect(standard).toMatchObject({ kind: "wouldNotWin", moveNumber: 11 });
    // Renju forbids black the overline outright, so it reports the forbidden shape.
    const renju = notes.find((note) => note.variant === RULE_VARIANTS.renju);
    expect(renju).toMatchObject({ kind: "forbiddenElsewhere", pattern: "overline" });
  });

  it("notes where the capture game would have taken a pair", () => {
    const game = play(createGame({ size: 9 }), [
      p(4, 1), p(4, 2),
      p(0, 0), p(4, 3),
      p(4, 4),
    ]);
    const ninuki = reviewAcrossVariants(game).find(
      (note) => note.variant === RULE_VARIANTS.ninuki,
    );
    expect(ninuki).toMatchObject({ kind: "captureElsewhere", moveNumber: 5 });
  });

  it("leaves connect6 out of a one-stone game and vice versa", () => {
    const game = play(createGame({ size: 9 }), [p(4, 4), p(4, 5)]);
    expect(
      reviewAcrossVariants(game).some((note) => note.variant === RULE_VARIANTS.connect6),
    ).toBe(false);

    const six = play(createGame({ variant: RULE_VARIANTS.connect6, size: 9 }), [p(4, 4)]);
    expect(reviewAcrossVariants(six)).toEqual([]);
  });
});
