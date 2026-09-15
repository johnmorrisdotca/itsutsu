import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { currentMemberId } from "@/lib/auth/currentSession";
import { APPLAUSE_EMOJI, type ApplauseEmoji } from "@/lib/history/applause.constants";
import { setApplause } from "@/lib/history/applause";
import { overLimit } from "@/lib/api/rateLimit";
import { XP_EVENTS } from "@/lib/xp/xp.constants";
import { awardCourtesy } from "@/lib/xp/xpSocial";

const applauseSchema = z.object({ emoji: z.enum(APPLAUSE_EMOJI) });

/**
 * Leaves a mark on a finished game, or takes it back.
 *
 * Any member may, not only the two who played: a game is worth watching or it
 * is not, and that is a reader's opinion to give. The same mark twice is a
 * change of mind, which removes it.
 *
 * BY MEMBER ID. It asked for an address, so a member who came in with an invite
 * code was told to sign in while signed in.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/applause">) {
  try {
    const tooMany = overLimit(request, "applause");
    if (tooMany !== null) return tooMany;

    const mine = await currentMemberId();
    if (mine === null) {
      return NextResponse.json({ error: "Sign in to leave a mark." }, { status: 401, headers: NO_STORE });
    }

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = applauseSchema.safeParse(body);
    if (!parsed.success) return badRequest("That is not one of the marks.");

    const { id } = await ctx.params;
    const outcome = await setApplause(id, mine, parsed.data.emoji as ApplauseEmoji);
    if (outcome.ok) {
      /*
       * XP for a mark LEFT, not for one taken back: the same mark pressed twice
       * is a change of mind and removes it, and `tally.mine` is what says which
       * of the two just happened.
       */
      if (outcome.tally.mine !== null) {
        await awardCourtesy({ memberId: mine, gameId: id, type: XP_EVENTS.applauseGiven });
      }
      return NextResponse.json(outcome.tally, { headers: NO_STORE });
    }
    if (outcome.reason === "not-found") return notFound("No such game.");
    return unprocessable("A game is applauded once it is finished.");
  } catch (error) {
    console.error(error);
    return serverError("Could not leave that mark.");
  }
}
