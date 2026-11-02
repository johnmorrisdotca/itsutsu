import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { giveTime } from "@/lib/history/liveGameEndings";
import { OFFER_NOT_ACCEPTED, OFFER_NOT_ACCEPTED_STATUS } from "@/lib/history/offers.constants";
import { seatCookieName } from "@/lib/history/seatCookie";
import { overLimit } from "@/lib/api/rateLimit";
import type { RefusalCode } from "@/lib/api/refusal.types";

const bodySchema = z.object({ token: z.string().min(1).max(128) }).partial();

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "no-clock": 409,
  "your-own-turn": 409,
  offered: OFFER_NOT_ACCEPTED_STATUS,
};

const REFUSAL_MESSAGE: Record<string, RefusalCode> = {
  "not-found": "err.game.none",
  finished: "err.game.over",
  "wrong-token": "err.game.notSeated",
  "no-clock": "err.clock.none",
  "your-own-turn": "err.clock.ownMove",
  offered: OFFER_NOT_ACCEPTED,
};

/**
 * Gives the other side more time on the current move. The seat is proved by
 * a token in the body or the seat cookie, as for a move.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/time">) {
  try {
    const tooMany = overLimit(request, "give-time");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const body = bodySchema.safeParse((await readJson(request)) ?? {});
    if (!body.success) return badRequest("err.invalid");
    const token = body.data.token ?? (await cookies()).get(seatCookieName(id))?.value;
    if (!token) return refuse(403, REFUSAL_MESSAGE["wrong-token"], undefined, { headers: NO_STORE });

    const outcome = await giveTime(id, token);
    if (!outcome.ok) {
      return refuse(REFUSAL_STATUS[outcome.reason] ?? 400, REFUSAL_MESSAGE[outcome.reason] ?? "err.game.notDone", undefined, { reason: outcome.reason, headers: NO_STORE });
    }
    return NextResponse.json(outcome.game, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.clock.giveFailed");
  }
}
