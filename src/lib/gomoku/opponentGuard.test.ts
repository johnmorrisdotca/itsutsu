import { describe, expect, it } from "vitest";

import { createGame, playMove } from "./engine";
import { GAME_STATUS, RULE_VARIANTS, STONES } from "./gomoku.constants";
import { BOT_TIERS } from "./opponent.constants";
import { chooseTurn, handsOverTheGame } from "./opponent";
import { applyTurn } from "./opponentTurns";
import { seededRandom } from "./rules/random";
import type { GameState } from "./gomoku.types";

/**
 * THE BLUNDER GUARD IS ON THE CLOCK, AND IT SAYS SO WHEN IT RUNS OUT.
 *
 * `handsOverTheGame` used to read every reply with no clock at all — up to two
 * hundred rule applications for each of thirty-four candidates, before the
 * search's clock had started. It now spends the same deadline the search
 * does, and the thing worth pinning is what it answers when the deadline has
 * gone: NULL, never false. A read that stopped part way has not found a
 * winning reply, and reporting "no danger" for a move nobody finished
 * checking is the plausible-looking wrong answer this codebase has been
 * bitten by before.
 */

/** A deadline the guard will not reach in these tests. */
const LIVE = () => Date.now() + 60_000;
/** A deadline already gone. */
const SPENT = 0;

/**
 * Black has an open four on row 4, and it is White to play. Whatever White
 * does now, Black completes five in reply.
 */
function openFourAgainstWhite(): GameState {
  let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
  const idle = [
    { row: 0, col: 0 },
    { row: 0, col: 8 },
    { row: 8, col: 0 },
  ];
  [2, 3, 4, 5].forEach((col, index) => {
    state = playMove(state, { row: 4, col });
    if (index < idle.length) state = playMove(state, idle[index]);
  });
  expect(state.toPlay).toBe(STONES.white);
  return state;
}

describe("the guard under the clock", () => {
  it("finds the reply that wins, given time", () => {
    const state = openFourAgainstWhite();
    const after = applyTurn(state, { kind: "place", row: 0, col: 4 });
    expect(after).not.toBe(state);
    expect(handsOverTheGame(after, STONES.white, LIVE())).toBe(true);
  });

  it("clears a move nothing wins against, given time", () => {
    const quiet = playMove(createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0), {
      row: 4,
      col: 4,
    });
    const after = applyTurn(quiet, { kind: "place", row: 3, col: 3 });
    expect(handsOverTheGame(after, STONES.white, LIVE())).toBe(false);
  });

  it("answers null, never false, when the clock has gone", () => {
    const state = openFourAgainstWhite();
    const after = applyTurn(state, { kind: "place", row: 0, col: 4 });
    // The danger is real, and an out-of-time read must not report it absent.
    expect(handsOverTheGame(after, STONES.white, SPENT)).toBeNull();

    const quiet = playMove(createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0), {
      row: 4,
      col: 4,
    });
    const calm = applyTurn(quiet, { kind: "place", row: 3, col: 3 });
    // And a move that IS safe is not cleared either: unread is unread.
    expect(handsOverTheGame(calm, STONES.white, SPENT)).toBeNull();
  });

  it("still answers a position that needs no reading, whatever the clock says", () => {
    // A finished game, and a turn that leaves the same side to move, are facts
    // about the position rather than readings of it.
    const state = openFourAgainstWhite();
    const won = playMove(playMove(state, { row: 8, col: 8 }), { row: 4, col: 6 });
    expect(won.status).toBe(GAME_STATUS.won);
    expect(handsOverTheGame(won, STONES.white, SPENT)).toBe(false);
  });

  it("lets a searching grade play a legal turn with no clock left at all", () => {
    /*
     * With nothing to spend, the guard reads nothing and the search finishes
     * no pass. The grade must still answer with a turn the engine accepts —
     * degraded, not broken.
     */
    const random = seededRandom(21);
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, random());
    for (let i = 0; i < 8; i += 1) {
      const turn = chooseTurn(state, BOT_TIERS.dan, random, { nodes: 50, millis: 60_000 });
      state = applyTurn(state, turn!);
    }
    for (const tier of [BOT_TIERS.meijin, BOT_TIERS.guoshou] as const) {
      const turn = chooseTurn(state, tier, seededRandom(3), { millis: 0 });
      expect(turn, `${tier} answered nothing`).not.toBeNull();
      expect(applyTurn(state, turn!), `${tier} offered a turn the engine refuses`).not.toBe(state);
    }
  });

  it("still stops a four when the clock is generous", () => {
    // The guard's job, unchanged by the clock: one saving point, and the grade finds it.
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    state = playMove(state, { row: 4, col: 2 });
    state = playMove(state, { row: 4, col: 1 });
    state = playMove(state, { row: 4, col: 3 });
    state = playMove(state, { row: 8, col: 0 });
    state = playMove(state, { row: 4, col: 4 });
    state = playMove(state, { row: 8, col: 8 });
    state = playMove(state, { row: 4, col: 5 });
    for (const tier of [BOT_TIERS.dan, BOT_TIERS.meijin, BOT_TIERS.guoshou] as const) {
      const turn = chooseTurn(state, tier, seededRandom(11), { nodes: 600, millis: 60_000 });
      const played = turn as { row: number; col: number };
      expect(`${played.row},${played.col}`, `${tier} let black finish the line`).toBe("4,6");
    }
  });
});
