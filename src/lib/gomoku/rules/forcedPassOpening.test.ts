import { describe, expect, it } from "vitest";

import { canChooseColour, canPass, createGame, extendOpening, mustPass, playMove } from "../engine";
import { OPENING_RULES, OPENING_STAGES } from "../gomoku.constants";
import type { GameState, Point } from "../gomoku.types";
import { passesOwed } from "./forcedPass";

/**
 * A COLOUR TO CHOOSE IS A MOVE, NEVER A PASS.
 *
 * The 0.192.0 regression: after swap2's third stone every point is refused
 * until the colour is chosen, so `mustPass` read "nothing to play" and the
 * automatic pass took the chooser's turn instead of offering the choice
 * (e2e/variants.spec.ts:63, red on main). Each of these positions waits on a
 * decision, and none of them owes a pass.
 */

const p = (row: number, col: number): Point => ({ row, col });
const three = [p(7, 7), p(7, 8), p(8, 8)];

function play(state: GameState, points: Point[]): GameState {
  return points.reduce((current, point) => playMove(current, point), state);
}

function expectNoPassOwed(state: GameState) {
  expect(canChooseColour(state)).toBe(true);
  expect(mustPass(state)).toBe(false);
  expect(canPass(state)).toBe(false);
  // The very same position back: nothing written, nothing handed on.
  expect(passesOwed(state)).toBe(state);
}

describe("a pending opening choice owes no pass", () => {
  it("swap2, after its third stone: take black, take white or extend", () => {
    const game = play(createGame({ opening: OPENING_RULES.swap2 }), three);
    expect(game.opening.stage).toBe(OPENING_STAGES.choosing);
    expectNoPassOwed(game);
  });

  it("swap2, after the extension's two stones hand the choice back", () => {
    const game = play(extendOpening(play(createGame({ opening: OPENING_RULES.swap2 }), three)), [p(6, 6), p(9, 9)]);
    expect(game.opening.stage).toBe(OPENING_STAGES.choosing);
    expectNoPassOwed(game);
  });

  it("plain swap, after its third stone", () => {
    expectNoPassOwed(play(createGame({ opening: OPENING_RULES.swap }), three));
  });
});
