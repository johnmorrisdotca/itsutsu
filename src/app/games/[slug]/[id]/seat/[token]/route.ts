import { NextResponse } from "next/server";

import { matchPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { seatForToken } from "@/lib/history/liveGame";
import { seatCookieName } from "@/lib/history/seatCookie";

/** How long a claimed seat is remembered. A shared game is played over days at most. */
const SEAT_COOKIE_DAYS = 30;

/**
 * Claims a seat.
 *
 * The link on the QR code lands here. The token is checked against the match,
 * put in a cookie for it, and the visitor sent on to the match's own address —
 * so the credential is used once and never shown again. A token that fits no
 * seat answers 404, the same as a match that does not exist: a guessed link
 * learns nothing about which ids are real.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/games/[slug]/[id]/seat/[token]">,
) {
  const { slug, id, token } = await ctx.params;
  const game = await fetchGameDetail(id);
  if (game === null || slugFor(game.variant) !== slug) {
    return new NextResponse(null, { status: 404 });
  }
  const seat = await seatForToken(id, token);
  if (seat === null) return new NextResponse(null, { status: 404 });

  const response = NextResponse.redirect(new URL(matchPath(game.variant, id), request.url), 303);
  response.cookies.set({
    name: seatCookieName(id),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEAT_COOKIE_DAYS * 24 * 60 * 60,
  });
  return response;
}
