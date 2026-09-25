import { NextResponse } from "next/server";

import { NO_STORE, notFound, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { setFavourite } from "@/lib/history/favourites";

/**
 * Stars a game the member played (PUT), or takes the star off (DELETE), so it
 * is listed first among their finished games (`favourites.ts`). Only the two
 * who sat in it: a game somebody else played answers as though it were not
 * there, which is what it is to the reader's list.
 */
async function answer(request: Request, ctx: RouteContext<"/api/games/[id]/favourite">, on: boolean) {
  try {
    const tooMany = overLimit(request, "favourite");
    if (tooMany !== null) return tooMany;
    const mine = await currentMemberId();
    if (mine === null) return NextResponse.json({ error: "Sign in to star a game." }, { status: 401, headers: NO_STORE });
    const { id } = await ctx.params;
    const outcome = await setFavourite(mine, id, on);
    if (outcome === "not-yours") return notFound("No game of yours by that id.");
    return NextResponse.json({ starred: outcome === "starred" }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that star.");
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/games/[id]/favourite">) {
  return answer(request, ctx, true);
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/games/[id]/favourite">) {
  return answer(request, ctx, false);
}
