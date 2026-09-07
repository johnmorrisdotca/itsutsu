import { NextResponse } from "next/server";
import { z } from "zod";

import {
  NO_STORE,
  badRequest,
  notFound,
  readJson,
  serverError,
} from "@/lib/api/apiResponse";
import { fetchGameMovesPage } from "@/lib/history/gameHistory";
import { appendMove } from "@/lib/history/liveGame";
import {
  GAME_PAGE_MAX,
  GAME_PAGE_SIZE_MAX,
  GAME_PAGE_SIZE_MIN,
} from "@/lib/history/gameHistory.constants";
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/api/rateLimit";

/**
 * A game's moves are always ordered by move number — a replay has exactly one
 * correct order — so this endpoint takes paging and nothing else.
 */
const movesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(GAME_PAGE_MAX).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(GAME_PAGE_SIZE_MIN)
    .max(GAME_PAGE_SIZE_MAX)
    .default(GAME_PAGE_SIZE_MAX),
});

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/games/[id]/moves">,
) {
  try {
    const url = new URL(request.url);
    const parsed = movesQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) return badRequest("Invalid paging parameters.");

    const { id } = await ctx.params;
    const page = await fetchGameMovesPage(id, parsed.data.page, parsed.data.pageSize);
    if (page === null) return notFound("No such game.");

    return NextResponse.json(page, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not load those moves.");
  }
}

const playSchema = z.object({
  token: z.string().min(1).max(128),
  row: z.number().int().min(0).max(64),
  col: z.number().int().min(0).max(64),
});

/** Each refusal has one honest status code; none of them leak whose turn it is. */
const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "not-your-turn": 409,
  illegal: 422,
  conflict: 409,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "That link does not hold a seat in this game.",
  "not-your-turn": "It is not your turn.",
  illegal: "That intersection cannot be played.",
  conflict: "Someone moved first. Reload to catch up.",
};

/**
 * Plays a stone in a shared game. The move is validated against the engine on
 * the server, so a client cannot play out of turn or onto a taken point by
 * asking nicely.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/games/[id]/moves">,
) {
  try {
    const limited = checkRateLimit(
      `move:${getClientIp(request)}`,
      RATE_LIMITS.playMove,
    );
    if (!limited.allowed) return createRateLimitResponse(limited);

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = playSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid move.");

    const { id } = await ctx.params;
    const outcome = await appendMove(id, parsed.data.token, {
      row: parsed.data.row,
      col: parsed.data.col,
    });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }

    return NextResponse.json(outcome.game, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not play that move.");
  }
}
