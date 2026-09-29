import { NextResponse } from "next/server";

import { NO_STORE, notFound, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { endTable } from "@/lib/party/online/server/tableSeats";

/** Ending a table for everybody, with nobody winning: only when `mayEnd` says so. */
export async function POST(request: Request, ctx: RouteContext<"/api/tables/[id]/end">) {
  try {
    const tooMany = overLimit(request, "table-seat", RATE_LIMITS.write);
    if (tooMany !== null) return tooMany;
    const readerId = await currentMemberId();
    if (readerId === null) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    const { id } = await ctx.params;
    const ended = await endTable(id, readerId);
    if (ended === "none") return notFound("No such table.");
    if (ended === "refused") {
      return NextResponse.json({ error: "A table can be ended before its first move, or once a turn has waited a week on somebody else." }, { status: 403, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not end that table.");
  }
}
