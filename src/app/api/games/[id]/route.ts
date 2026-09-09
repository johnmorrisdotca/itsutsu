import { NextResponse } from "next/server";

import { NO_STORE, notFound, serverError } from "@/lib/api/apiResponse";
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/api/rateLimit";
import { deleteGame, fetchGameDetail } from "@/lib/history/gameHistory";

/**
 * One game, with every stone in the order it was played.
 *
 * This is the route a live board polls, so it is the one route on the site
 * that a single open tab calls on a timer. It answers `no-store` — a board
 * two moves out of date is worse than no board — which means every call
 * reaches the database, and a page left open in a loop would otherwise have
 * no ceiling at all.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/games/[id]">) {
  try {
    const limited = checkRateLimit(`game:${getClientIp(request)}`, RATE_LIMITS.pollGame);
    if (!limited.allowed) return createRateLimitResponse(limited);

    const { id } = await ctx.params;
    const game = await fetchGameDetail(id);
    if (game === null) return notFound("No such game.");

    return NextResponse.json(game, { status: 200, headers: NO_STORE });
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
