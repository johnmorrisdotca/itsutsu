import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { APPLAUSE_EMOJI, type ApplauseEmoji } from "@/lib/history/applause.constants";
import { setApplause } from "@/lib/history/applause";

const applauseSchema = z.object({ emoji: z.enum(APPLAUSE_EMOJI) });

/**
 * Leaves a mark on a finished game, or takes it back.
 *
 * Anybody signed in may, not only the two who played: a game is worth
 * watching or it is not, and that is a reader's opinion to give. The same
 * mark twice is a change of mind, which removes it.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/applause">) {
  try {
    const me = await currentSession();
    if (!me?.email) {
      return NextResponse.json({ error: "Sign in to leave a mark." }, { status: 401, headers: NO_STORE });
    }

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = applauseSchema.safeParse(body);
    if (!parsed.success) return badRequest("That is not one of the marks.");

    const { id } = await ctx.params;
    const outcome = await setApplause(id, me.email, parsed.data.emoji as ApplauseEmoji);
    if (outcome.ok) return NextResponse.json(outcome.tally, { headers: NO_STORE });
    if (outcome.reason === "not-found") return notFound("No such game.");
    return unprocessable("A game is applauded once it is finished.");
  } catch (error) {
    console.error(error);
    return serverError("Could not leave that mark.");
  }
}
