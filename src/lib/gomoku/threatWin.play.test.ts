import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import { forcedBudget, forcedWinTurn } from "./forcedWin";
import { chooseTurn } from "./opponent";
import { applyTurn } from "./opponentTurns";
import { threatWinTurn } from "./threatWin";
import { fivePoints, holds } from "./threatWin.test-support";

/**
 * THE SOUNDNESS OF A WIN BY THREATS, ACROSS REAL GAMES — asked for by name.
 *
 * `pnpm bots:threats`. Each claim the finder makes through a three is checked
 * against every legal reply the defender has, all the way down, and that is
 * minutes rather than the seconds a unit test may take: a three has two hundred
 * replies to read and each of those an open four's two hundred more. The
 * hand-built cases in `threatWin.test.ts` run in every build; this is the wider
 * net, for any change to either finder. `BOT_THREATS_GAMES` sets how many games
 * of each rule set to play (default 5).
 */
const ASKED = process.env.BOT_THREATS === "1";
const GAMES = Number(process.env.BOT_THREATS_GAMES ?? 5);

describe.skipIf(!ASKED)("a win by threats, across real games", () => {
  it("never claims a win that does not hold, across real games in three rule sets", () => {
    let claimed = 0;
    for (const variant of [RULE_VARIANTS.freestyle, RULE_VARIANTS.standard, RULE_VARIANTS.renju]) {
      for (let game = 0; game < GAMES; game += 1) {
        let seed = 29 + game * 131 + variant.length;
        const random = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 2 ** 32;
        };
        let state = createGame({ variant, size: 15 } as never);
        while (state.status === GAME_STATUS.playing && state.moves.length < 80) {
          const byThreats = fivePoints(state, state.toPlay).length === 0 && threatWinTurn(state, forcedBudget({ nodes: 20_000 }), 1) !== null;
          const byFours = byThreats && forcedWinTurn(state, forcedBudget({ nodes: 20_000 })) !== null;
          // Only the claims the fours could not make are new here; those have their own test.
          if (byThreats && !byFours) {
            claimed += 1;
            expect(holds(state, state.toPlay, 10, 1), `${variant} game ${game} at move ${state.moves.length}`).toBe(true);
            break;
          }
          const turn = chooseTurn(state, game % 2 === 0 ? "kyu" : "razryad", random, { nodes: 300 });
          if (turn === null) break;
          state = applyTurn(state, turn);
        }
      }
    }
    // The check means nothing if the games never produced a claim to check.
    console.log(`claims checked: ${claimed}`);
    expect(claimed).toBeGreaterThanOrEqual(3);
  }, 3_600_000);
});
