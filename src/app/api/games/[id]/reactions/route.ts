import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { checkRateLimit, createRateLimitResponse } from "@/lib/api/rateLimit";
import { addReaction } from "@/lib/history/reactions";
import { REACTION_EMOJI, REACTION_RATE_LIMIT } from "@/lib/history/reactions.constants";

const reactionSchema = z.object({
  token: z.string().min(1).max(128),
  emoji: z.enum(REACTION_EMOJI),
  moveNumber: z.number().int().min(1).max(1000).nullable().default(null),
});

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  "wrong-token": 403,
  "no-such-move": 422,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  "wrong-token": "That link does not hold a seat in this game.",
  "no-such-move": "That move has not been played.",
};

/**
 * Sends an emoji to the other player. The emoji must be one of the fixed set
 * and the sender must hold a seat, so there is nothing here a stranger can
 * put in front of anyone. Limited per seat rather than per address, because
 * one enthusiastic player is the case worth bounding.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/games/[id]/reactions">,
) {
  try {
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid reaction.");

    const { id } = await ctx.params;
    const limited = checkRateLimit(`reaction:${id}:${parsed.data.token}`, REACTION_RATE_LIMIT);
    if (!limited.allowed) return createRateLimitResponse(limited);

    const outcome = await addReaction(
      id,
      parsed.data.token,
      parsed.data.emoji,
      parsed.data.moveNumber,
    );

    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(outcome.game, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not send that.");
  }
}
