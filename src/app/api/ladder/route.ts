import { NextResponse } from "next/server";

import { NO_STORE, badRequest, serverError } from "@/lib/api/apiResponse";
import { isRefusal } from "@/lib/api/paging";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { fetchLadderPage, readLadderPaging } from "@/lib/rating/ladder";

/**
 * The site ladder, one page at a time.
 *
 * ITS OWN ADDRESS RATHER THAN A MODE OF `/api/players`, which is the
 * autocomplete: a query there means "names starting with these letters", and
 * hanging a second meaning on the same address would make `q` and `sort`
 * parameters that cannot both be present. The ladder is a collection of its own
 * — it has an order, a page and a membership rule — so it gets a name.
 *
 * `{ items, next, total }` — the convention's envelope from `lib/api/paging.ts`,
 * with `total` filled in because it is one `count` over the same condition the
 * page already reads. `/players`'s ladder tab is the client of it, appending the
 * pages after the first as a reader scrolls.
 *
 * An unknown sort is refused BY NAME with the columns it does have. That the
 * PAGE degrades where this refuses is deliberate and stated on the page: a
 * reader who followed a stale link gets the ladder, a caller who wrote this
 * address gets told which word was wrong.
 */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "ladder", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const asked = readLadderPaging(new URL(request.url).searchParams);
    if (isRefusal(asked)) return badRequest(asked.error);

    return NextResponse.json(await fetchLadderPage(asked), {
      status: 200,
      // The ladder moves whenever a rated game is decided, so nothing is cached.
      headers: NO_STORE,
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not load the ladder.");
  }
}
