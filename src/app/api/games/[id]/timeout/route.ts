import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { claimTimeout } from "@/lib/history/liveGameEndings";
import { OFFER_NOT_ACCEPTED, OFFER_NOT_ACCEPTED_STATUS } from "@/lib/history/offers.constants";
import { overLimit } from "@/lib/api/rateLimit";
import type { RefusalCode } from "@/lib/api/refusal.types";

const claimSchema = z.object({ token: z.string().min(1).max(128) });

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "no-clock": 409,
  "not-due": 409,
  "your-own-turn": 409,
  offered: OFFER_NOT_ACCEPTED_STATUS,
};

const REFUSAL_MESSAGE: Record<string, RefusalCode> = {
  "not-found": "err.game.none",
  finished: "err.game.over",
  "wrong-token": "err.game.wrongLink",
  "no-clock": "err.clock.none",
  "not-due": "err.clock.notUp",
  "your-own-turn": "err.clock.notTheirs",
  // No clock runs against a game nobody has agreed to play, so nobody is late.
  offered: OFFER_NOT_ACCEPTED,
};

/**
 * Claims the other player's missed deadline. The server decides whether it
 * is really missed, from the last move's time and the game's limit, so a
 * client cannot hurry a slow opponent by asking early.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/games/[id]/timeout">,
) {
  try {
    const tooMany = overLimit(request, "claim-timeout");
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) return badRequest("err.clock.invalidClaim");

    const { id } = await ctx.params;
    const outcome = await claimTimeout(id, parsed.data.token);
    if (!outcome.ok) {
      return refuse(REFUSAL_STATUS[outcome.reason] ?? 400, REFUSAL_MESSAGE[outcome.reason], undefined, { reason: outcome.reason, headers: NO_STORE });
    }
    return NextResponse.json(outcome.game, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.clock.claimFailed");
  }
}
