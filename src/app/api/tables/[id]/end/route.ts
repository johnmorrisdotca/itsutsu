import { NextResponse } from "next/server";

import { NO_STORE, notFound, refuse, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { endTable } from "@/lib/party/online/server/tableSeats";

/** Ending a table for everybody, with nobody winning: only when `mayEnd` says so. */
export async function POST(request: Request, ctx: RouteContext<"/api/tables/[id]/end">) {
  try {
    const tooMany = overLimit(request, "table-seat", RATE_LIMITS.write);
    if (tooMany !== null) return tooMany;
    const readerId = await currentMemberId();
    if (readerId === null) return refuse(401, "err.signIn", undefined, { headers: NO_STORE });
    const { id } = await ctx.params;
    const ended = await endTable(id, readerId);
    if (ended === "none") return notFound("err.table.none");
    if (ended === "refused") {
      return refuse(403, "err.table.endRefused", undefined, { headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.table.endFailed");
  }
}
