import { describe, expect, it } from "vitest";

import { createGame, playMove } from "../engine";
import { GAME_STATUS, RULE_VARIANTS, STONES } from "../gomoku.constants";
import { flipsAt, inLayingPhase } from "../rules/flips";
import { seededRandom } from "../rules/random";
import { BOT_TIERS } from "../opponent.constants";
import { chooseTurn } from "../opponent";
import { applyTurn } from "../opponentTurns";
import type { BotTier } from "../opponent.types";
import { flipCandidates } from "./flipExpert";

/**
 * The Reversi specialist at Classic Reversi, whose first four discs are laid
 * in the centre rather than set out.
 *
 * Found by a mixed bot batch on a scratch database: Tamenoki, as black, chose a
 * flipping move while the centre was still being laid, the rules refused it,
 * and the game sat at move 2 for ever — on the live site, any game against him
 * at Classic Reversi would have done the same.
 */
describe("the Reversi specialist while the centre discs are being laid", () => {
  it("offers no flip while the centre is half laid, though a flip is on the board to be read", () => {
    // The position the live game stalled in: two centre discs down, black to lay the third.
    let state = createGame({ variant: RULE_VARIANTS.classicReversi, size: 8, seed: 1 });
    state = playMove(state, { row: 4, col: 3 });
    state = playMove(state, { row: 3, col: 4 });
    expect(state.moves).toHaveLength(2);
    expect(inLayingPhase(state)).toBe(true);
    // A reading of flips would find one here — the move Tamenoki chose, and the rules refused.
    expect(flipsAt(state.board, 8, state.toPlay, { row: 2, col: 5 }).length).toBeGreaterThan(0);
    expect(playMove(state, { row: 2, col: 5 })).toBe(state);
    expect(flipCandidates(state, 16)).toEqual([]);
  });

  it.each([
    [BOT_TIERS.tamenoki, BOT_TIERS.razryad],
    [BOT_TIERS.razryad, BOT_TIERS.tamenoki],
  ] as [BotTier, BotTier][])(
    "plays Classic Reversi from the empty board to a finish as %s against %s, every turn accepted",
    (blackTier, whiteTier) => {
      const random = seededRandom(7);
      let state = createGame({
        variant: RULE_VARIANTS.classicReversi,
        size: 8,
        seed: 7,
        allowUndo: false,
        allowSwap: false,
      });
      for (let ply = 0; ply < 200 && state.status === GAME_STATUS.playing; ply += 1) {
        const tier = state.toPlay === STONES.black ? blackTier : whiteTier;
        const turn = chooseTurn(state, tier, random, { millis: 20 });
        expect(turn, `no turn at ply ${ply}`).not.toBeNull();
        const next = applyTurn(state, turn!);
        expect(next, `the rules refused ${JSON.stringify(turn)} at ply ${ply}`).not.toBe(state);
        state = next;
      }
      expect(state.status).not.toBe(GAME_STATUS.playing);
    },
  );
});
