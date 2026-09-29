import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REVALIDATE, notFound, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { memberKeyOf } from "@/lib/auth/memberKey";
import { memberRowFor, touchMemberFromPoll } from "@/lib/auth/memberRow";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { holdsVersion } from "@/lib/history/gameVersion";
import { readTableRow, tableVersion, viewOf } from "@/lib/party/online/server/tableRead";

/**
 * ONE TABLE, AS A PAGE AT IT POLLS IT. The one route a table's page calls on a
 * timer, so it answers "nothing changed" whenever it can: the version first,
 * one indexed read (`tableVersion`), and a 304 when the page already holds it.
 * Only a changed table reads the seats and sends the game — never replayed,
 * only handed over as the text its rules keep it in.
 *
 * Beside it, at most once a minute, the reader is stamped as seen, as the live
 * board's poll does: a player sitting at a table is on the site, and the pages
 * waiting on them ask faster for it (`POLL_FAST_MS`).
 *
 * A reader not seated at the table is told there is no such table.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/tables/[id]">) {
  try {
    const tooMany = overLimit(request, "table-poll", RATE_LIMITS.pollGame);
    if (tooMany !== null) return tooMany;
    const { id } = await ctx.params;
    const now = new Date();
    /*
     * Who is asking, off the signed cookie with no query — a session carries
     * its member's id; only an older Google cookie naming an address costs a
     * read — and not through `currentSession`, which would read the member row
     * on every poll.
     */
    const key = memberKeyOf(await verifySession((await cookies()).get(SESSION_COOKIE)?.value));
    const readerId = key === null ? null : key.by === "id" ? key.value : ((await memberRowFor(key.by, key.value))?.id ?? null);
    if (key === null || readerId === null) return notFound("No such table.");
    const [version] = await Promise.all([
      tableVersion(id, readerId, now),
      touchMemberFromPoll(key, now).catch((error: unknown) => console.error(error)),
    ]);
    if (version === null) return notFound("No such table.");
    const headers = { ...REVALIDATE, ETag: version.tag };
    if (holdsVersion(request.headers.get("if-none-match"), version.tag)) return new NextResponse(null, { status: 304, headers });

    const row = await readTableRow(id);
    const view = row === null ? null : viewOf(row, readerId, version.here, now);
    if (view === null) return notFound("No such table.");
    return NextResponse.json(view, { status: 200, headers });
  } catch (error) {
    console.error(error);
    return serverError("Could not read that table.");
  }
}
