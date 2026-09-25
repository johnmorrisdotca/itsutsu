import { expect } from "vitest";

import { createGame } from "./engine";
import { GAME_STATUS } from "./gomoku.constants";
import { fitsLineBoard } from "./lineBoard";
import { chooseTurn } from "./opponent";
import { applyTurn } from "./opponentTurns";
import { threatWinTurn } from "./threatWin";
import type { RuleVariant } from "./gomoku.types";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const unlimited = () => ({ nodes: 1e9, until: Infinity });

/**
 * THE FINDERS ON THE LINE BOARD ANSWER AS THE FINDERS ON COPIES, position after
 * position of three real games of one variant.
 *
 * One variant a file (`lineThreats.<variant>.test.ts`), because the three used to
 * be one test of 223 seconds, and the unit tests, however they were split,
 * could never finish sooner than their slowest file: it was most of every
 * deploy's wait (measured 2026-09-25). Split, the three run side by side, and
 * each still has to clear the whole bar the one test had — more than forty
 * positions compared and more than two forced wins found — which each variant
 * does on its own (70 / 3, 50 / 12, 66 / 5 when split).
 */
export function finderAgreement(variant: RuleVariant): { compared: number; found: number } {
  let compared = 0;
  let found = 0;
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
  return { compared, found };
}
