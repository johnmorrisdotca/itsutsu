import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { matchPath } from "@/lib/gomoku/slugs";
import { currentSession, currentMemberId } from "@/lib/auth/currentSession";
import { sitAtOpenSeat } from "@/lib/history/openGames";
import { bindSeat, wouldAnswerTheirOwnInvitation } from "@/lib/history/seats";
import { playBotTurns } from "@/lib/bots/botPlay";
import { seatCookieName } from "@/lib/history/seatCookie";
import { cookies } from "next/headers";
import { seatForToken } from "@/lib/history/liveGame";
import { overLimit } from "@/lib/api/rateLimit";

/** How long a claimed seat is remembered — the same as a scanned seat link. */
const SEAT_COOKIE_DAYS = 30;

/**
 * Sits down at a game posted for anyone. The seat's token goes straight into
 * this browser's cookie for the match, the way a seat link would have put it
 * there, and the answer says where the board is.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/sit">) {
  try {
    const tooMany = overLimit(request, "sit");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    /*
     * The other door into the same room. `sitAtOpenSeat` asks whether a seat
     * is taken and never who is taking it, so the person who posted a seat
     * could answer it from the lobby as readily as by following its link.
     * Asked before the seat is claimed, because claiming it is the thing that
     * must not happen — afterwards there is nothing left to refuse.
     */
    /*
     * The same refusal, for a browser rather than an account. Somebody who
     * never signed in has no member id to recognise, but if they are already
     * holding a seat at this board their cookie says so — and taking the
     * other one is the same act whether or not the site knows their name.
     */
    const held = (await cookies()).get(seatCookieName(id))?.value;
    if (held !== undefined && (await seatForToken(id, held)) !== null) {
      return NextResponse.json(
        { error: "You already have a seat at this board.", reason: "own-seat" },
        { status: 409, headers: NO_STORE },
      );
    }

    const mineFirst = await currentMemberId();
    if (mineFirst !== null && (await wouldAnswerTheirOwnInvitation(id, mineFirst))) {
      return NextResponse.json(
        { error: "You posted this seat — it is waiting for somebody else.", reason: "own-seat" },
        { status: 409, headers: NO_STORE },
      );
    }
    const outcome = await sitAtOpenSeat(id);
    if (!outcome.ok) {
      return NextResponse.json(
        {
          error: outcome.reason === "taken" ? "Somebody else just took that seat." : "No such game.",
          reason: outcome.reason,
        },
        { status: outcome.reason === "taken" ? 409 : 404, headers: NO_STORE },
      );
    }
    const session = await currentSession();
    const mine = mineFirst;
    if (mine !== null) await bindSeat(id, outcome.seat, mine, session?.name ?? "");
    /*
     * Sitting down opposite a computer that opens: it plays at once, so the
     * board is not showing you a game waiting on a player that never waits.
     * This is also the moment the fresh deadline stamp from `sitAtOpenSeat`
     * would otherwise be sitting against the computer's seat.
     */
    try {
      await playBotTurns(id);
    } catch (error) {
      console.error(error);
    }
    const response = NextResponse.json(
      { path: matchPath(outcome.variant, id), seat: outcome.seat },
      { status: 200, headers: NO_STORE },
    );
    response.cookies.set({
      name: seatCookieName(id),
      value: outcome.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SEAT_COOKIE_DAYS * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error(error);
    return serverError("Could not take that seat.");
  }
}
