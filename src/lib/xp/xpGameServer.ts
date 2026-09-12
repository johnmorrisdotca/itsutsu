import "server-only";

import { awardXp } from "./awardXp";
import { gameAwards, type FinishedGame, type PlayedSideFacts } from "./xpGame";
import { awardTourBonuses } from "./xpTour";

/**
 * Paying a finished game, one bound seat at a time.
 *
 * The seam between `recordPlayed` — which is the one place a decided game is
 * seen exactly once per bound member id — and the ledger. It holds no rules:
 * `xpGame.ts` decides what a game pays and `awardXp` decides what an award comes
 * to, so what is left here is the order of the two calls and the one thing that
 * cannot be decided before the first has happened, which is whether the tour's
 * collection just became complete.
 *
 * Why `recordPlayed` and not the four endings: `recordPlayed` already answers a
 * self-game once from black, already skips an unbound seat, and already refuses
 * a row whose result it cannot read. Every one of those is a rule an award needs
 * and none of them wants a second implementation.
 */

/** One bound seat and everything its awards depend on. */
export type XpSide = { memberId: string; facts: PlayedSideFacts };

/**
 * Pay every bound seat for the game that has just been decided.
 *
 * One batch per member rather than one call per award, so a game that paid for
 * three things writes one flash and the toasts read as one stack — "+65 XP"
 * teaches a member less than three lines saying what each part was for.
 *
 * Sequential rather than `Promise.all`, deliberately: the two seats of a
 * self-game are one member (answered once by `playedSides`), and two batches
 * racing for one member's row would have each read the total the other was about
 * to change. A finished game is not a hot path.
 */
export async function awardFinishedGameXp(
  game: FinishedGame,
  sides: readonly XpSide[],
): Promise<void> {
  for (const side of sides) {
    const paid = await awardXp({ memberId: side.memberId, awards: gameAwards(game, side.facts) });
    /* AFTER the batch, and only because of what it paid. A first game of a
       variant is what can complete the set of thirty-nine, so the question is
       worth asking exactly when one was just paid for and at no other time. */
    await awardTourBonuses({ memberId: side.memberId, paid });
  }
}
