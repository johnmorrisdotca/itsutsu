import { NextResponse } from "next/server";

import { matchPath, seatPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { currentSession, currentMemberId } from "@/lib/auth/currentSession";
import { seatForToken } from "@/lib/history/liveGame";
import { bindSeat, markSeatTaken, wouldAnswerTheirOwnInvitation } from "@/lib/history/seats";
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
  if (game === null) return new NextResponse(null, { status: 404 });
  /*
   * A seat link is printed once and then lives in somebody's messages. If the
   * rules were changed after it was sent — which they may be, right up to the
   * first stone — the name in it is out of date, and refusing it would strand
   * the person who was invited. The token still has to be this game's.
   */
  if (slugFor(game.variant) !== slug) {
    return NextResponse.redirect(new URL(seatPath(game.variant, id, token), request.url));
  }
  const seat = await seatForToken(id, token);
  if (seat === null) return new NextResponse(null, { status: 404 });

  const session = await currentSession();
  const mine = await currentMemberId();
  /*
   * Nobody answers their own public invitation. Sending yourself a seat link
   * and playing from two devices stays exactly as it was — that is wanted —
   * but a seat posted for anyone is not one the poster may take. They already
   * have a seat at this board, so the board is where they are sent, and the
   * posted seat is left for whoever it was posted for.
   */
  if (mine !== null && (await wouldAnswerTheirOwnInvitation(id, mine, seat))) {
    return NextResponse.redirect(new URL(matchPath(game.variant, id), request.url), 303);
  }
  // Signed in: the seat is the account's now, on every device.
  if (mine !== null) await bindSeat(id, seat, mine, session?.name ?? "");

  /*
   * Somebody is sitting here now, so the link stops being shown. The token is
   * the whole credential — it plays this seat on its own — and a link still on
   * screen after the seat is taken is that player's credential displayed to
   * whoever else is looking at the board.
   */
  await markSeatTaken(id, seat);

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
