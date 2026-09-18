import "server-only";

import { resolveSeat } from "@/lib/history/seats";
import type { CatchUpSeat } from "@/components/mine/botCatchUp.types";
import type { MyGames } from "@/lib/history/myGames.types";
import { unansweredBotTurns } from "./unansweredBotTurns";

/**
 * The games this browser may make an abandoned computer move in, each with the
 * seat key to make it with.
 *
 * `unansweredBotTurns` says WHICH games are waiting; this says whether the
 * reader holds the seat, and it asks the same function the match page asks —
 * `resolveSeat`, which answers by seat cookie or by the member the session
 * names. Anything it will not name a seat for is left out rather than handed
 * over: a game whose cookie has gone and whose seats belong to somebody else is
 * one this browser would be refused on, and a request that can only fail is
 * worse than doing nothing.
 *
 * A read a game, and only for a game already found stuck — at most
 * `UNANSWERED_TURNS_AT_ONCE` of them, and none at all on the ordinary visit
 * where nothing is waiting.
 */
export async function catchUpSeats(
  groups: Pick<MyGames, "theirMove" | "unstarted">,
  claims: ReadonlyMap<string, string>,
  memberId: string | null,
  now: Date,
): Promise<CatchUpSeat[]> {
  const waiting = unansweredBotTurns(groups, now);
  const seats = await Promise.all(
    waiting.map(async (one) => {
      const claim = await resolveSeat(one.game.id, claims.get(one.game.id), memberId);
      return claim === null ? null : { id: one.game.id, token: claim.token };
    }),
  );
  return seats.filter((seat): seat is CatchUpSeat => seat !== null);
}
