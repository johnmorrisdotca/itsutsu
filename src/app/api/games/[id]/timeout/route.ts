import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { claimTimeout } from "@/lib/history/liveGameEndings";
import { overLimit } from "@/lib/api/rateLimit";

const claimSchema = z.object({ token: z.string().min(1).max(128) });

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "no-clock": 409,
  "not-due": 409,
  "your-own-turn": 409,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "That link does not hold a seat in this game.",
  "no-clock": "This game has no clock.",
  "not-due": "Their time is not up yet.",
  "your-own-turn": "It is your move, not theirs.",
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
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid claim.");

    const { id } = await ctx.params;
    const outcome = await claimTimeout(id, parsed.data.token);
    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(outcome.game, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not claim that.");
  }
}
