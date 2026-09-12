import { cookies } from "next/headers";
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
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { playBotTurns } from "@/lib/bots/botPlay";
import { truncateMoves } from "@/lib/history/hotSeat";
import { seatCookieName } from "@/lib/history/seatCookie";
import { pieceCellsSchema } from "@/lib/history/gameSettingsSchema";
import {
  GAME_PAGE_MAX,
  GAME_PAGE_SIZE_MAX,
  GAME_PAGE_SIZE_MIN,
} from "@/lib/history/gameHistory.constants";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { OFFER_NOT_ACCEPTED, OFFER_NOT_ACCEPTED_STATUS } from "@/lib/history/offers.constants";

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
      pageSize: url.searchParams.get("limit") ?? undefined,
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

const coordinate = z.number().int().min(0).max(64);

/** A stone, a sliding piece, or the twist that finishes a stone. */
/** The seat key: sent in the body by a device that scanned a link, or held in this browser's cookie. */
async function seatToken(id: string, given: string | undefined): Promise<string> {
  if (given !== undefined && given !== "") return given;
  return (await cookies()).get(seatCookieName(id))?.value ?? "";
}

const playSchema = z.object({
  token: z.string().min(1).max(128).optional(),
  row: coordinate.optional(),
  col: coordinate.optional(),
  /** The colour to place, in the games where the mover chooses. */
  stone: z.enum(["black", "white"]).optional(),
  from: z.object({ row: coordinate, col: coordinate }).optional(),
  twist: z
    .object({ quadrant: z.number().int().min(0).max(15), clockwise: z.boolean() })
    .optional(),
  cells: pieceCellsSchema.optional(),
  pass: z.boolean().optional(),
});

/** Each refusal has one honest status code; none of them leak whose turn it is. */
const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  "not-your-turn": 409,
  illegal: 422,
  conflict: 409,
  offered: OFFER_NOT_ACCEPTED_STATUS,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "That link does not hold a seat in this game.",
  "not-your-turn": "It is not your turn.",
  illegal: "That intersection cannot be played.",
  conflict: "Someone moved first. Reload to catch up.",
  /*
   * Its own answer rather than "finished" or "not your turn", both of which
   * were in range and both of which would have been lies: the game has not
   * ended and it may well be this seat's turn. A fork offer even has stones on
   * it. What is missing is the other person's agreement.
   */
  offered: OFFER_NOT_ACCEPTED,
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
    const tooMany = overLimit(request, "move", RATE_LIMITS.playMove);
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = playSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid move.");

    const { id } = await ctx.params;
    const { row, col, from, twist, cells, pass, stone } = parsed.data;
    const token = await seatToken(id, parsed.data.token);
    const move =
      pass === true
        ? { kind: "pass" as const }
        : cells !== undefined && cells !== null
          ? { kind: "piece" as const, cells }
        : twist !== undefined
        ? { kind: "twist" as const, ...twist }
        : row !== undefined && col !== undefined
          ? from !== undefined
            ? { kind: "move" as const, row, col, from }
            : { kind: "place" as const, row, col, stone }
          : null;
    if (move === null) return badRequest("Invalid move.");
    const outcome = await appendMove(id, token, move);

    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }

    /*
     * If the other seat is a computer, it answers here rather than on the next
     * poll: the request that played your stone comes back with the reply in
     * it. That is the whole reason a computer never needs the deadline
     * machinery — it has already moved by the time you see the board.
     *
     * A failure to answer is not a failure to move. The stone is on the record
     * and the game is sound; the computer will be asked again on the next
     * request that touches this game.
     */
    let game = outcome.game;
    try {
      await playBotTurns(id);
      game = (await fetchGameDetail(id)) ?? game;
    } catch (error) {
      console.error(error);
    }

    return NextResponse.json(game, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not play that move.");
  }
}

const truncateSchema = z.object({
  token: z.string().min(1).max(128).optional(),
  /** How many moves to keep. Everything after them is struck from the record. */
  keep: z.number().int().min(0).max(4096),
});

/**
 * Takes moves back. Only a hot-seat game — one key for both chairs — may be
 * rewound; a shared game's record is final. The body says how many moves to
 * keep, so a retried request is harmless.
 */
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/games/[id]/moves">,
) {
  try {
    const tooMany = overLimit(request, "move", RATE_LIMITS.playMove);
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = truncateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request.");

    const { id } = await ctx.params;
    const outcome = await truncateMoves(id, await seatToken(id, parsed.data.token), parsed.data.keep);
    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(outcome.game, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not take that back.");
  }
}
