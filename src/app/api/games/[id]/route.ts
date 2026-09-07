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

/** Removes a game and its moves. Idempotent: deleting twice still answers 404. */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/games/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const removed = await deleteGame(id);
    if (!removed) return notFound("No such game.");

    return new NextResponse(null, { status: 204, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not delete that game.");
  }
}
