import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/api/rateLimit";
import { currentSession } from "@/lib/auth/currentSession";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import { moveTimeSchema } from "@/lib/history/gameSettingsSchema";
import { cancelRequest, fetchMyRequests, requestMatch } from "@/lib/social/autoMatch";

const askSchema = z.object({ variant: z.enum(RULE_VARIANT_LIST), moveTimeMs: moveTimeSchema });
const cancelSchema = z.object({ id: z.string().min(1).max(64) });

/** The signed-in member's waiting requests. */
export async function GET() {
  try {
    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    return NextResponse.json({ items: await fetchMyRequests(me.email) }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read your requests.");
  }
}

/** Asks for a game. Answers with the match's address when paired at once, or the waiting request. */
export async function POST(request: Request) {
  try {
    const limited = checkRateLimit(`automatch:${getClientIp(request)}`, RATE_LIMITS.createGame);
    if (!limited.allowed) return createRateLimitResponse(limited);
    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) return badRequest("Which game, at what pace?");

    const outcome = await requestMatch(me.email, parsed.data.variant, parsed.data.moveTimeMs);
    if (outcome.kind === "refused") {
      const message = outcome.reason === "too-many" ? "Five requests waiting is the most." : "No such game.";
      return NextResponse.json({ error: message }, { status: 409, headers: NO_STORE });
    }
    if (outcome.kind === "matched") {
      return NextResponse.json(
        { matched: true, path: matchPath(outcome.variant, outcome.gameId) },
        { status: 201, headers: { ...NO_STORE, Location: matchPath(outcome.variant, outcome.gameId) } },
      );
    }
    return NextResponse.json({ matched: false, requestId: outcome.requestId }, { status: 202, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not ask for a game.");
  }
}

export async function DELETE(request: Request) {
  try {
    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) return badRequest("Which request?");
    await cancelRequest(me.email, parsed.data.id);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not cancel that.");
  }
}
