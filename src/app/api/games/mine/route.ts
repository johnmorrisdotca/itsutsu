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
    const queue = await fetchMyGames(claims, await currentMemberId(), new Date(), await keepFinishedDaysFor(email));
    const { groups } = queue;
    return NextResponse.json(
      {
        yourMove: groups.yourMove.length,
        /*
         * Offers waiting on this reader, counted separately rather than added
         * into `yourMove`.
         *
         * `yourMove` is read by the advance to the next game as well as by the
         * badge — `useAdvanceToNextGame` takes `groups.yourMove` and walks it —
         * so a count that quietly included offers would have sent somebody to a
         * board they had not agreed to play on. Two numbers, each true of one
         * thing; the badge adds them and its words keep them apart.
         */
        offered: groups.offered.length,
        /*
         * EVERY GROUP, AS AN ARRAY, EXACTLY AS BEFORE — and `groups.finished` is
         * now ONE PAGE of itself rather than every finished game the member has
         * ever played. That is the whole of what this route's cost fix changes
         * for a caller: the key is there, it is a list, and it is short.
         *
         * The two facts a page cannot state about the group it came from travel
         * BESIDE the groups, in `finished` below, rather than replacing the
         * array with an envelope. `doorstep.spec.ts` sums `list.length` across
         * every value of `groups`, so an envelope in one of the seven would have
         * made that `NaN` with nothing failing — and the badge and the advance
         * read `yourMove` and `offered` only, which are untouched.
         */
        groups,
        /*
         * The finished group's paging, in the convention's own words: how many
         * there are, and where the page ended. `next` is null for "that was the
         * last page" and never for "ask again later" — see `PagedEnvelope`.
         */
        finished: queue.finished,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not read your games.");
  }
}
