import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { matchPath } from "@/lib/gomoku/slugs";
import { currentSession } from "@/lib/auth/currentSession";
import { sitAtOpenSeat } from "@/lib/history/openGames";
import { bindSeat } from "@/lib/history/seats";
import { seatCookieName } from "@/lib/history/seatCookie";

/** How long a claimed seat is remembered — the same as a scanned seat link. */
const SEAT_COOKIE_DAYS = 30;

/**
 * Sits down at a game posted for anyone. The seat's token goes straight into
 * this browser's cookie for the match, the way a seat link would have put it
 * there, and the answer says where the board is.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/games/[id]/sit">) {
  try {
    const { id } = await ctx.params;
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
    if (session?.email) await bindSeat(id, outcome.seat, session.email, session.name ?? "");
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
