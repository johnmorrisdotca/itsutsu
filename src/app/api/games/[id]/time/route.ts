import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { giveTime } from "@/lib/history/liveGameEndings";
import { seatCookieName } from "@/lib/history/seatCookie";

const bodySchema = z.object({ token: z.string().min(1).max(128) }).partial();

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "no-clock": 409,
  "your-own-turn": 409,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "You do not hold a seat in this game.",
  "no-clock": "This game has no clock.",
  "your-own-turn": "It is your move; time is given to the other side.",
};

/**
 * Gives the other side more time on the current move. The seat is proved by
 * a token in the body or the seat cookie, as for a move.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/time">) {
  try {
    const { id } = await ctx.params;
    const body = bodySchema.safeParse((await readJson(request)) ?? {});
    if (!body.success) return badRequest("Invalid request.");
    const token = body.data.token ?? (await cookies()).get(seatCookieName(id))?.value;
    if (!token) return NextResponse.json({ error: REFUSAL_MESSAGE["wrong-token"] }, { status: 403, headers: NO_STORE });

    const outcome = await giveTime(id, token);
    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason] ?? "That could not be done.", reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(outcome.game, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not give time.");
  }
}
