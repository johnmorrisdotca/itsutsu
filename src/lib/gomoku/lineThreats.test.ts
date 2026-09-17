import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import { fitsLineBoard } from "./lineBoard";
import { chooseTurn } from "./opponent";
import { applyTurn } from "./opponentTurns";
import { threatWinTurn } from "./threatWin";
import { position } from "./threatWin.test-support";
import type { RuleVariant } from "./gomoku.types";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const unlimited = () => ({ nodes: 1e9, until: Infinity });

describe("the finders of forced wins on a line board", () => {
  it("find the double three the finders on copies find", () => {
    const state = position([[7, 6], [7, 7], [5, 8], [6, 8]], [[0, 0], [0, 14], [14, 0], [14, 14]]);
    expect(threatWinTurn(state, unlimited(), 1, "auto")).toEqual(threatWinTurn(state, unlimited(), 1, "states"));
    expect(threatWinTurn(state, unlimited(), 1, "auto")).not.toBeNull();
  });

  it("answer as the finders on copies answer, position after position of real games", () => {
    let compared = 0;
    let found = 0;
    for (const variant of [RULE_VARIANTS.freestyle, RULE_VARIANTS.standard, RULE_VARIANTS.renju] as RuleVariant[]) {
      for (let game = 0; game < 3; game += 1) {
        const random = seeded(71 + game * 17 + variant.length);
        let state = createGame({ variant, size: 15 } as never);
        while (state.status === GAME_STATUS.playing && state.moves.length < 70) {
          // Every third position: the finders on copies are the slow reference, and the sample still covers every phase.
          if (state.moves.length >= 8 && state.moves.length % 3 === 0 && fitsLineBoard(state)) {
            for (const threes of [0, 1]) {
              const onBoard = threatWinTurn(state, unlimited(), threes, "auto");
              const onCopies = threatWinTurn(state, unlimited(), threes, "states");
              expect(onBoard, `${variant} game ${game} move ${state.moves.length} threes ${threes}`).toEqual(onCopies);
              compared += 1;
              if (onBoard !== null) found += 1;
            }
          }
          const turn = chooseTurn(state, game % 2 === 0 ? "kyu" : "dan", random, { nodes: 300 });
          if (turn === null) break;
          state = applyTurn(state, turn);
        }
      }
    }
    expect(compared).toBeGreaterThan(40);
    // The comparison means little if neither ever found anything.
    expect(found).toBeGreaterThan(2);
  }, 600_000);
});
