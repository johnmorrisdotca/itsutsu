import { NextResponse } from "next/server";

import {
  NO_STORE,
  badRequest,
  readJson,
  serverError,
  unprocessable,
} from "@/lib/api/apiResponse";
import { isRefusal } from "@/lib/api/paging";
import { fetchGameHistoryPage } from "@/lib/history/gameHistory";
import { toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";
import { gameRecordSchema, recordGame } from "@/lib/history/gameRecord";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";

/**
 * Game history.
 *
 * `GET` lists games with paging, sorting, free-text search and filters, in the
 * envelope every listing endpoint here uses:
 * `{ pagination, next, items, facets }`.
 *
 * `next` is the cursor the following page starts at, or null at the end — the
 * one convention from `lib/api/paging.ts`, which every list on this site is
 * moving to. `pagination` is kept beside it for the pager that works without
 * JavaScript; they answer two different readers, and the head of
 * `fetchGameHistoryPage` says which.
 *
 * The facets count the whole filtered set, not the page, so filter chips can
 * show totals without a second round trip.
 *
 * A PARAMETER IT CANNOT HONOUR IS REFUSED BY NAME. This used to answer every
 * unreadable query with "Invalid listing parameters." — a 400 that left a caller
 * who mistyped one of fifteen filters to find out which by bisection. An
 * unreadable CURSOR is the deliberate exception: it is a string this site handed
 * out rather than one anybody typed, so a stale one starts the record again
 * instead of putting an error in front of a reader who did nothing wrong.
 */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "games", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const query = toGameHistoryQuery(new URL(request.url));
    if (isRefusal(query)) return badRequest(query.error);

    return NextResponse.json(await fetchGameHistoryPage(query), {
      status: 200,
      headers: NO_STORE,
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not load game history.");
  }
}

/** `POST` records one finished game and returns it with its move list. */
export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "record", RATE_LIMITS.recordGame);
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = gameRecordSchema.safeParse(body);
    if (!parsed.success) {
      return unprocessable("That game could not be recorded.", parsed.error.issues);
    }

    const game = await recordGame(parsed.data);
    return NextResponse.json(game, {
      status: 201,
      headers: { ...NO_STORE, Location: `/api/games/${game.id}` },
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not record that game.");
  }
}
