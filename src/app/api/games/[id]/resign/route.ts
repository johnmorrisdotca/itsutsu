import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, readJson, serverError } from "@/lib/api/apiResponse";
import { resignGame } from "@/lib/history/liveGameEndings";
import { seatCookieName } from "@/lib/history/seatCookie";

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
  "not-allowed": "This game was set up so that nobody may resign it.",
};

/**
 * Resigns a game. The seat is proved by a token in the body or, failing that,
 * the seat cookie for this match — the same claim the match page reads — so
 * the button on the games list needs to send nothing but the id.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/resign">) {
  try {
    const { id } = await ctx.params;
    const body = bodySchema.safeParse((await readJson(request)) ?? {});
    const token = body.success && body.data.token ? body.data.token : (await cookies()).get(seatCookieName(id))?.value;
    if (!token) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE["wrong-token"], reason: "wrong-token" },
        { status: 403, headers: NO_STORE },
      );
    }

    const outcome = await resignGame(id, token);
    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason] ?? "That could not be done.", reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(outcome.game, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not resign that game.");
  }
}
