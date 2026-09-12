import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { declineOffer } from "@/lib/history/offerAnswer";
import { OFFER_REFUSAL_MESSAGE, OFFER_REFUSAL_STATUS } from "@/lib/history/offers.constants";

/**
 * Says no to a game somebody offered you.
 *
 * AND IT COSTS NOTHING, which is the whole of the feature and is enforced in
 * `declineOffer` rather than promised here: no rating write, no run over every
 * game played, no XP either way, no winner, no result. John: "no penalties for
 * refusing."
 *
 * The offeree only, by member id. There is no way to decline on somebody's
 * behalf, and no credential that could be handed to anybody who would want to.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/offer/decline">) {
  try {
    const tooMany = overLimit(request, "offer-decline");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const outcome = await declineOffer(id, await currentMemberId());
    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.said ?? OFFER_REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: OFFER_REFUSAL_STATUS[outcome.reason], headers: NO_STORE },
      );
    }
    return NextResponse.json({ declined: true }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not decline that game.");
  }
}
