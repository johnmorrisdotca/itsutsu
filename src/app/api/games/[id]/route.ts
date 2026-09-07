import { NextResponse } from "next/server";

import { NO_STORE, notFound, serverError } from "@/lib/api/apiResponse";
import { deleteGame, fetchGameDetail } from "@/lib/history/gameHistory";

/** One game, with every stone in the order it was played. */
export async function GET(_request: Request, ctx: RouteContext<"/api/games/[id]">) {
  try {
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
