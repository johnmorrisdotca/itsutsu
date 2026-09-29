import { NextResponse } from "next/server";

import { NO_STORE, notFound, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { leaveTable } from "@/lib/party/online/server/tableSeats";

/** Leaving a table: the reader's seat opens again with a fresh link (`leaveTable`). */
export async function POST(request: Request, ctx: RouteContext<"/api/tables/[id]/leave">) {
  try {
    const tooMany = overLimit(request, "table-seat", RATE_LIMITS.write);
    if (tooMany !== null) return tooMany;
    const readerId = await currentMemberId();
    if (readerId === null) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    const { id } = await ctx.params;
    const left = await leaveTable(id, readerId);
    if (left === "none") return notFound("No such table.");
    if (left === "over") return NextResponse.json({ error: "That table is over." }, { status: 409, headers: NO_STORE });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not leave that table.");
  }
}
