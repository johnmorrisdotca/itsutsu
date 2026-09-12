import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { matchPath } from "@/lib/gomoku/slugs";
import { acceptOffer } from "@/lib/history/offerAnswer";
import { OFFER_REFUSAL_MESSAGE, OFFER_REFUSAL_STATUS } from "@/lib/history/offers.constants";
import { playBotTurns } from "@/lib/bots/botPlay";

/**
 * Takes a game that was offered to you.
 *
 * BY MEMBER ID AND NOTHING ELSE. An offer mints no credential — there is no
 * token in the address, none in the body, and none was ever handed out — so the
 * only thing that can answer one is the account it was addressed to. Anybody
 * else gets the same 404 as a game that is not an offer; see
 * `offers.constants.ts` for why those two answers are identical.
 *
 * Rate-limited under the ordinary write scope, which is what sitting down at a
 * posted seat uses. This is the same size of act: one row, once.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/offer/accept">) {
  try {
    const tooMany = overLimit(request, "offer-accept");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const me = await currentMemberId();
    const session = await currentSession();
    const outcome = await acceptOffer(id, me, session?.name ?? "");
    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.said ?? OFFER_REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: OFFER_REFUSAL_STATUS[outcome.reason], headers: NO_STORE },
      );
    }

    /*
     * A computer never holds an offered seat — nothing is offered to a program,
     * which has nothing to accept with — so this is here for the other half of
     * the board: an accepted game whose OPENER is a computer plays its stone
     * now, exactly as it does when a posted seat is answered. The board the
     * accepter lands on is a board with a move on it rather than one waiting on
     * a player that never waits.
     */
    try {
      await playBotTurns(id);
    } catch (error) {
      console.error(error);
    }

    return NextResponse.json(
      { path: matchPath(outcome.variant, id), seat: outcome.seat },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not accept that game.");
  }
}
