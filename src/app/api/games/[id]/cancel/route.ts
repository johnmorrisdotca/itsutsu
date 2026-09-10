import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { z } from "zod";

import { NO_STORE, readJson, serverError } from "@/lib/api/apiResponse";
import { cancelGame } from "@/lib/history/liveGameEndings";
import { seatCookieName } from "@/lib/history/seatCookie";
import { overLimit } from "@/lib/api/rateLimit";

const bodySchema = z.object({ token: z.string().min(1).max(128) }).partial();

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "not-allowed": 409,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "You do not hold a seat in this game.",
  "not-allowed": "That game has stones on it — resign it rather than calling it off.",
};

/**
 * Calls off a game nothing has happened in — no winner, no loser, no rating.
 *
 * A separate door from resigning rather than a flag on it, so that the thing
 * that costs nobody anything cannot be reached by accident from the thing
 * that does. The seat is proved the same way: a token in the body or the seat
 * cookie for this match.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/cancel">) {
  try {
    const tooMany = overLimit(request, "resign");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const body = bodySchema.safeParse((await readJson(request)) ?? {});
    const token = body.success && body.data.token ? body.data.token : (await cookies()).get(seatCookieName(id))?.value;
    if (!token) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE["wrong-token"], reason: "wrong-token" },
        { status: 403, headers: NO_STORE },
      );
    }

    const outcome = await cancelGame(id, token);
    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason] ?? "That could not be done.", reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    /*
     * No farewell from the computer, and that is deliberate. There was no game
     * to be thanked for, and "good game" over an empty board is the same
     * mistake as thanking somebody before the first stone.
     */
    return NextResponse.json(outcome.game, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not call off that game.");
  }
}
