import { NextResponse } from "next/server";

import { NO_STORE, notFound, refuse, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { leaveTable } from "@/lib/party/online/server/tableSeats";

/** Leaving a table: the reader's seat opens again with a fresh link (`leaveTable`). */
export async function POST(request: Request, ctx: RouteContext<"/api/tables/[id]/leave">) {
  try {
    const tooMany = overLimit(request, "table-seat", RATE_LIMITS.write);
    if (tooMany !== null) return tooMany;
    const readerId = await currentMemberId();
    if (readerId === null) return refuse(401, "err.signIn", undefined, { headers: NO_STORE });
    const { id } = await ctx.params;
    const left = await leaveTable(id, readerId);
    if (left === "none") return notFound("err.table.none");
    if (left === "over") return refuse(409, "err.table.over", undefined, { headers: NO_STORE });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.table.leaveFailed");
  }
}
