import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { NO_STORE, REVALIDATE, notFound, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { memberKeyOf } from "@/lib/auth/memberKey";
import { touchMemberFromPoll } from "@/lib/auth/memberRow";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { deleteGame, fetchGameDetail } from "@/lib/history/gameHistory";
import { gameVersion, holdsVersion } from "@/lib/history/gameVersion";

/**
 * One game, with every stone in the order it was played.
 *
 * This is the route a live board polls, so it is the one route on the site
 * that a single open tab calls on a timer. Every call reaches the database —
 * a board two moves out of date is worse than no board — but a call from a
 * board already holding the current version reads one row and answers 304,
 * and a page left open in a loop would otherwise have no ceiling at all.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/games/[id]">) {
  try {
    const tooMany = overLimit(request, "game", RATE_LIMITS.pollGame);
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    /*
     * The version first, and the game only when the board does not already
     * hold it — see `gameVersion`. Read in that order, a write landing between
     * the two reads leaves the tag OLDER than the body, so the next ask
     * mismatches and fetches again: the safe way round. The browser does the
     * rest itself, because `no-cache` with a tag means "keep it, but ask
     * first": it sends the tag back, takes a 304 as the copy it already has,
     * and `useLiveGame` never learns the difference.
     *
     * BESIDE IT, AND AT THE SAME TIME, the reader is marked as seen — at most
     * once a minute, by a condition in the write, so almost every ask writes
     * nothing (`touchMemberFromPoll`). A player sitting on a board is on the
     * site, and their opponent's board asks faster for it (`POLL_FAST_MS`).
     * Who the reader is comes off the signed cookie with no query, and the two
     * statements run side by side, so an ask is still one round trip of wall
     * time. A stamp that fails costs the stamp, never the answer.
     */
    const now = new Date();
    const reader = memberKeyOf(await verifySession((await cookies()).get(SESSION_COOKIE)?.value));
    const [version] = await Promise.all([
      gameVersion(id, now),
      reader === null ? null : touchMemberFromPoll(reader, now).catch((error: unknown) => console.error(error)),
    ]);
    if (version === null) return notFound("No such game.");
    const headers = { ...REVALIDATE, ETag: version.tag };
    if (holdsVersion(request.headers.get("if-none-match"), version.tag)) {
      return new NextResponse(null, { status: 304, headers });
    }

    const game = await fetchGameDetail(id);
    if (game === null) return notFound("No such game.");
    return NextResponse.json({ ...game, here: version.here }, { status: 200, headers });
  } catch (error) {
    console.error(error);
    return serverError("Could not load that game.");
  }
}

/**
 * Whether a request carries the operator's token. There are no accounts, so
 * destructive operations are gated on one secret set in the environment; with
 * none set, they do not exist at all. A public deployment must never expose an
 * unauthenticated delete over the whole history table.
 */
function isOperator(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

/**
 * Removes a game and its moves. Idempotent: deleting twice still answers 404.
 * Operator only — and a wrong or missing token answers 404 too, so the route
 * gives nothing away about which ids exist.
 */
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/games/[id]">,
) {
  try {
    if (!isOperator(request)) return notFound("No such game.");
    const { id } = await ctx.params;
    const removed = await deleteGame(id);
    if (!removed) return notFound("No such game.");

    return new NextResponse(null, { status: 204, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not delete that game.");
  }
}
