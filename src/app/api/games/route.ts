import { NextResponse } from "next/server";

import {
  NO_STORE,
  badRequest,
  readJson,
  serverError,
  unprocessable,
} from "@/lib/api/apiResponse";
import { fetchGameHistoryPage } from "@/lib/history/gameHistory";
import { toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";
import { gameRecordSchema, recordGame } from "@/lib/history/gameRecord";
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/api/rateLimit";

/**
 * Game history.
 *
 * `GET` lists games with paging, sorting, free-text search and filters, in the
 * envelope every listing endpoint here uses: `{ pagination, items, facets }`.
 * The facets count the whole filtered set, not the page, so filter chips can
 * show totals without a second round trip.
 */
export async function GET(request: Request) {
  try {
    const limited = checkRateLimit(
      `games:${getClientIp(request)}`,
      RATE_LIMITS.read,
    );
    if (!limited.allowed) return createRateLimitResponse(limited);

    const query = toGameHistoryQuery(new URL(request.url));
    if (query === null) return badRequest("Invalid listing parameters.");

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
    const limited = checkRateLimit(
      `record:${getClientIp(request)}`,
      RATE_LIMITS.recordGame,
    );
    if (!limited.allowed) return createRateLimitResponse(limited);

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
