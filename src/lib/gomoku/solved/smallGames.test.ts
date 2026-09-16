import { describe, expect, it } from "vitest";

import { isSolvedSmall, perfectTurns } from "./smallGames";
import { createGame } from "../engine";
import { applyTurn, legalTurns, sameTurn } from "../opponentTurns";
import { chooseTurn } from "../opponent";
import { GAME_STATUS, RULE_VARIANTS } from "../gomoku.constants";
import { BOT_TIERS } from "../opponent.constants";
import type { BotTier } from "../opponent.types";
import type { GameState, RuleVariant } from "../gomoku.types";

/**
 * Walks a game, counting how often a grade throws away a result it was holding.
 *
 * The truth comes from `perfectTurns`, which is the same table the grade uses —
 * so this cannot show a grade agreeing with a table that is itself wrong. What
 * it CAN show, and what it is for, is a grade departing from the table it is
 * supposed to be following, and the weaker grades never consulting it at all.
 */
function threwAway(variant: RuleVariant, tier: BotTier, limit: number): { asked: number; threw: number } {
  let asked = 0;
  let threw = 0;

  const walk = (state: GameState, depth: number) => {
    if (asked >= limit || state.status !== GAME_STATUS.playing || depth > 9) return;
    const turns = legalTurns(state, 200);
    if (turns.length < 2) return;

    const best = perfectTurns(state);
    if (best !== null) {
      const chosen = chooseTurn(state, tier, Math.random, { nodes: 8_000, millis: 5_000 });
      if (chosen !== null) {
        asked += 1;
        if (!best.some((one) => sameTurn(one, chosen))) threw += 1;
      }
    }

    for (const turn of turns.slice(0, 2)) {
      const next = applyTurn(state, turn);
      if (next !== state) walk(next, depth + 1);
    }
  };

  walk(createGame({ variant }, 0), 0);
  return { asked, threw };
}

describe("the games small enough to solve", () => {
  it("names the ones it has actually been measured for, and no others", () => {
    expect(isSolvedSmall(RULE_VARIANTS.tictactoe)).toBe(true);
    expect(isSolvedSmall(RULE_VARIANTS.notakto)).toBe(true);
    // A small BOARD is not a small tree. Trap Three is 5×5 and Maker-Breaker
    // 6×6, and neither has been solved here — declared, never inferred.
    expect(isSolvedSmall(RULE_VARIANTS.trapThree)).toBe(false);
    expect(isSolvedSmall(RULE_VARIANTS.makerBreaker)).toBe(false);
    expect(isSolvedSmall(RULE_VARIANTS.freestyle)).toBe(false);
  });

  it("says nothing at all about a game it has no table for", () => {
    // Null is "I do not know". A turn here would be a guess wearing the
    // authority of a solved game, which the chooser is about to trust.
    expect(perfectTurns(createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0))).toBeNull();
  });

  it("takes a win that is one move away", () => {
    let state = createGame({ variant: RULE_VARIANTS.tictactoe, firstPlayer: "black" }, 0);
    for (const [row, col] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
      state = applyTurn(state, { kind: "place", row, col });
    }
    expect(state.toPlay).toBe("black");

    const best = perfectTurns(state);
    expect(best).not.toBeNull();
    // Every one of them must actually win: on a solved game "best" is the
    // whole set of moves holding the true value, not a preference.
    for (const turn of best!) {
      const next = applyTurn(state, turn);
      expect(next.status).toBe(GAME_STATUS.won);
      expect(next.winner).toBe("black");
    }
  });
});

describe("who plays from the table", () => {
  /*
   * The promise. Meijin and 国手 carry `blunder: 0` and `guard: 1`, and on a
   * game this size keeping that is free. Measured before the table existed,
   * they threw 1% at Wild tic-tac-toe and 14% at Notakto.
   */
  for (const tier of [BOT_TIERS.meijin, BOT_TIERS.guoshou]) {
    it(`${tier} never throws a held result at a solved game`, () => {
      for (const variant of [RULE_VARIANTS.tictactoe, RULE_VARIANTS.wildTicTacToe, RULE_VARIANTS.notakto]) {
        const { asked, threw } = threwAway(variant, tier, 60);
        // The tolerant half enumerated: a run that asked nothing proves
        // nothing, and would pass silently for ever.
        expect(asked, `${variant}: nothing was asked, so nothing was shown`).toBeGreaterThan(5);
        expect(threw, `${variant}: ${tier} departed from the solved table`).toBe(0);
      }
    });
  }

  it("leaves the weaker grades exactly as weak as they were", () => {
    /*
     * The restraint is the point, not an oversight. Razryad's weakness is a
     * player who did not see the win; handing it the answer and having it look
     * away is a different thing, and John has not asked for it. If this ever
     * goes to zero, the ladder below the top has been flattened.
     */
    const { asked, threw } = threwAway(RULE_VARIANTS.notakto, BOT_TIERS.razryad, 60);
    expect(asked).toBeGreaterThan(5);
    expect(threw, "razryad should still be beatable at Notakto").toBeGreaterThan(0);
  });
});
