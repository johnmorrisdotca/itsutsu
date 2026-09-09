import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { NO_STORE, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentEmail, currentMemberId } from "@/lib/auth/currentSession";
import { fetchMyGames } from "@/lib/history/myGames";
import { keepFinishedDaysFor } from "@/lib/auth/members";
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
    const tooMany = overLimit(request, "mine", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const claims = seatClaims((await cookies()).getAll());
    const email = await currentEmail();
    const games = await fetchMyGames(claims, await currentMemberId(), new Date(), await keepFinishedDaysFor(email));
    return NextResponse.json(
      { yourMove: games.yourMove.length, groups: games },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not read your games.");
  }
}
