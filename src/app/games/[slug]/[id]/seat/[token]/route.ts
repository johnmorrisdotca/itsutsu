import { NextResponse } from "next/server";

import { matchPath, seatPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { currentSession, currentMemberId } from "@/lib/auth/currentSession";
import { seatForToken } from "@/lib/history/liveGame";
import { bindSeat, markSeatTaken, wouldAnswerTheirOwnInvitation } from "@/lib/history/seats";
import { seatCookieName } from "@/lib/history/seatCookie";
import { activeLimitRefusal, memberOverActiveLimit } from "@/lib/history/activeGames";

/** How long a claimed seat is remembered. A shared game is played over days at most. */
const SEAT_COOKIE_DAYS = 30;

/** Text into markup. Nothing here is caller-supplied today; it is not the kind of thing to leave depending on that. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The refusal, as a page rather than as JSON.
 *
 * This route is followed by a person clicking a link, not by a script, so a
 * bare status is a blank window and a redirect to the board is worse — they
 * would arrive as a spectator with nothing saying their seat had not been
 * taken, which is the failure that looks exactly like success. It says the
 * number and leaves a way onward.
 *
 * Deliberately plain, and the only hand-written markup on the site. Giving it
 * the site's own chrome means a page component, and this file is a route
 * handler; that is worth doing and belongs with whoever owns the components,
 * not with the gap this was closing.
 */
function seatRefusalPage(message: string, board: string): string {
  const safe = escapeHtml(message);
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Too many games</title></head>
<body style="margin:0;padding:3rem 1.5rem;font:16px/1.6 system-ui,sans-serif;color:#1c1917;background:#faf9f7">
<main style="max-width:32rem;margin:0 auto">
<h1 style="font-size:1.5rem;margin:0 0 1rem">That seat is still yours to take — later</h1>
<p style="margin:0 0 1rem">${safe}</p>
<p style="margin:0 0 1.5rem">This link still works. Come back to it when a board has finished.</p>
<p style="margin:0"><a href="${escapeHtml(board)}" style="color:#1d4ed8">Look at the board</a> &nbsp;·&nbsp; <a href="/my-games" style="color:#1d4ed8">Your games</a></p>
</main>
</body>
</html>`;
}

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
  /*
   * Twenty boards is the limit however the twenty-first arrives, and this is
   * the door where one most quietly did. A private game binds nobody when it
   * is created — `createLiveGame` writes a member id onto a seat only when
   * the request already named one — so the creation check looked at two empty
   * seats and had nothing to count. Binding here is the moment the board
   * becomes somebody's, which makes it the moment the question is worth
   * asking, and it was the one moment nobody asked it.
   *
   * Before `bindSeat` and before `markSeatTaken`, and the second matters as
   * much as the first: the stamp is what stops a seat link being shown again.
   * Refusing and stamping together would cost them the link as well as the
   * seat, so the invitation they were sent would be spent on a refusal and
   * useless an hour later when they had finished a game and could take it.
   *
   * Only for somebody signed in. An anonymous seat belongs to no member, so
   * there is no count to be over and nobody to ask about.
   */
  if (mine !== null) {
    const atTheLimit = await memberOverActiveLimit([mine]);
    if (atTheLimit !== null) {
      return new NextResponse(seatRefusalPage(activeLimitRefusal(atTheLimit), matchPath(game.variant, id)), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
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
