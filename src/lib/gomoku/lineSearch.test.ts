import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import { fitsLineBoard } from "./lineBoard";
import { chooseTurn } from "./opponent";
import { searchTurn } from "./opponentSearch";
import { applyTurn } from "./opponentTurns";
import type { GameState, RuleVariant } from "./gomoku.types";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function midGame(variant: RuleVariant, size: number, plies: number, seed: number): GameState {
  const random = seeded(seed);
  let state = createGame({ variant, size } as never);
  for (let ply = 0; ply < plies && state.status === GAME_STATUS.playing; ply += 1) {
    const turn = chooseTurn(state, "dan", random, { nodes: 200 });
    if (turn === null) break;
    state = applyTurn(state, turn);
  }
  return state;
}

/** Enough budget that neither search is ever stopped early: the comparison is of what they read, not how fast. */
const UNLIMITED = { nodes: 1e9, millis: 1e9 };

describe("the search on a line board", () => {
  it("chooses the move the search on copies of the game chooses, position after position", () => {
    let compared = 0;
    for (const [variant, size, plies, seed] of [
      [RULE_VARIANTS.freestyle, 15, 10, 1],
      [RULE_VARIANTS.freestyle, 15, 22, 2],
      [RULE_VARIANTS.standard, 15, 16, 3],
      [RULE_VARIANTS.renju, 15, 14, 4],
      [RULE_VARIANTS.omok, 15, 18, 5],
      [RULE_VARIANTS.freestyle, 9, 8, 6],
      [RULE_VARIANTS.freestyle, 19, 20, 7],
    ] as const) {
      const state = midGame(variant, size, plies, seed);
      if (state.status !== GAME_STATUS.playing) continue;
      expect(fitsLineBoard(state)).toBe(true);
      for (const defence of [undefined, 0.3, 2.4]) {
        const onCopies = searchTurn(state, 4, seeded(99), UNLIMITED, defence, "states");
        const onBoard = searchTurn(state, 4, seeded(99), UNLIMITED, defence, "auto");
        expect(onBoard, `${variant} ${size} after ${state.moves.length}, style ${defence}`).toEqual(onCopies);
        compared += 1;
      }
    }
    expect(compared).toBeGreaterThan(15);
  }, 300_000);
});
