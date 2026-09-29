import { NextResponse } from "next/server";

import { currentMemberRow, currentSession } from "@/lib/auth/currentSession";
import { partyKindFor, variantFor } from "@/lib/gomoku/slugs";
import { isOnlineGame } from "@/lib/party/online/onlineGames";
import { tablePath, tableSeatPath } from "@/lib/party/online/onlinePaths";
import { claimSeat } from "@/lib/party/online/server/tableSeats";

/**
 * AN OPEN SEAT'S LINK, OPENED. The link is the seat: a signed-in member who
 * opens it takes it (`claimSeat`), and is sent on to the table's own address
 * — so the credential is used once and never shown again. The same shape as
 * a game's seat link and a puzzle race's (`match/[id]/seat/[token]`).
 *
 * A reader with no session is sent to join and comes back to the same link.
 * A session with no member (the operator signed in by token) is sent to the
 * table, which says there is no such table for them. A link that fits no
 * seat of this table answers 404, the same as a table that does not exist.
 */
export async function GET(request: Request, ctx: RouteContext<"/games/[slug]/tables/[id]/seat/[token]">) {
  const { slug, id, token } = await ctx.params;
  const game = partyKindFor(slug) ?? variantFor(slug);
  if (game === null || !isOnlineGame(game)) return new NextResponse(null, { status: 404 });
  const session = await currentSession();
  if (session === null) {
    const join = new URL("/join", request.url);
    join.searchParams.set("next", tableSeatPath(game, id, token));
    return NextResponse.redirect(join, 303);
  }
  const me = await currentMemberRow();
  const table = new URL(tablePath(game, id), request.url);
  if (me === null) return NextResponse.redirect(table, 303);
  const claimed = await claimSeat(id, token, { id: me.id, name: me.name ?? "" });
  if (claimed === "none") return new NextResponse(null, { status: 404 });
  if (claimed === "taken") table.searchParams.set("seat", "full");
  if (claimed === "over") table.searchParams.set("seat", "over");
  if (typeof claimed === "object") {
    table.searchParams.set("seat", "refused");
    table.searchParams.set("reason", claimed.refused);
  }
  return NextResponse.redirect(table, 303);
}
