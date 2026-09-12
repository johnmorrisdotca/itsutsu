import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { withdrawOffer } from "@/lib/history/offerAnswer";
import { OFFER_REFUSAL_MESSAGE, OFFER_REFUSAL_STATUS } from "@/lib/history/offers.constants";

/**
 * Takes an offer back, before it has been answered.
 *
 * THE OFFERER'S HALF, and it is not decoration. An offer somebody has not
 * looked at sits in the offerer's list as a board they are holding, and it
 * counts against the twenty they may hold at once — so a way out of it is part
 * of the feature rather than a nicety. It is also the return trip: a control
 * that can be entered and not left is the one-directional fault only the way
 * back finds.
 *
 * It costs nobody anything, for the same reasons a decline does not, and by the
 * same code path — `endOffer` in `offerAnswer.ts` writes one column differently
 * and nothing else. The offeree is told nothing: they never agreed to hear from
 * this game.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/offer/withdraw">) {
  try {
    const tooMany = overLimit(request, "offer-withdraw");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const outcome = await withdrawOffer(id, await currentMemberId());
    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.said ?? OFFER_REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: OFFER_REFUSAL_STATUS[outcome.reason], headers: NO_STORE },
      );
    }
    return NextResponse.json({ withdrawn: true }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not withdraw that offer.");
  }
}
