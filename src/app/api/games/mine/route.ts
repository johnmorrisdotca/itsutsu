import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/api/rateLimit";
import { currentEmail } from "@/lib/auth/currentSession";
import { fetchMyGames } from "@/lib/history/myGames";
import { seatClaims } from "@/lib/history/seatCookie";

/**
 * The games this browser holds a seat in, sorted into a queue. "Mine" is
 * decided by the seat cookies on the request: there are no accounts, so the
 * cookies are the only thing that knows which seats are yours.
 *
 * The badge beside "Play" asks this on a timer from every page, so like the
 * board's own poll it is called far more often than a person clicks anything,
 * and it is capped for the same reason.
 */
export async function GET(request: Request) {
  try {
    const limited = checkRateLimit(`mine:${getClientIp(request)}`, RATE_LIMITS.read);
    if (!limited.allowed) return createRateLimitResponse(limited);

    const claims = seatClaims((await cookies()).getAll());
    const games = await fetchMyGames(claims, await currentEmail());
    return NextResponse.json(
      { yourMove: games.yourMove.length, groups: games },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not read your games.");
  }
}
