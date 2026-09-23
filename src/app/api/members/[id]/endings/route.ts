import { NextResponse } from "next/server";

import { NO_STORE, badRequest, serverError } from "@/lib/api/apiResponse";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { fetchEndings } from "@/lib/history/endings";
import { ENDINGS_OUTCOME_LIST, type EndingsOutcome } from "@/lib/history/endings.constants";

/**
 * A member's finished games of one game, with their moves, for the browser to
 * draw as one picture of how each ended — see `fetchEndings`. Members only, by
 * the gate in `src/proxy.ts`, like everything else that names a member.
 *
 * `?variant=` is the game, required; `?outcome=` is won, lost or all.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/members/[id]/endings">) {
  try {
    const tooMany = overLimit(request, "endings", RATE_LIMITS.endings);
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const query = new URL(request.url).searchParams;
    const variant = query.get("variant") ?? "";
    const outcome = (query.get("outcome") ?? "all") as EndingsOutcome;
    if (!(RULE_VARIANT_LIST as readonly string[]).includes(variant)) return badRequest("Which game?");
    if (!(ENDINGS_OUTCOME_LIST as readonly string[]).includes(outcome)) return badRequest("Won, lost or all?");

    const games = await fetchEndings(id, variant, outcome);
    return NextResponse.json({ games }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read those games.");
  }
}
