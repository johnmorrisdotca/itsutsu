import { NextResponse } from "next/server";
import { z } from "zod";

import {
  NO_STORE,
  badRequest,
  readJson,
  serverError,
  unprocessable,
} from "@/lib/api/apiResponse";
import {
  DEFAULT_SETTINGS,
  NO_HANDICAP,
  STONES,
  VARIANT_SPECS,
} from "@/lib/gomoku/gomoku.constants";
import { PLAYER_NAME_MAX } from "@/lib/history/gameHistory.constants";
import {
  boardSizeSchema,
  handicapSchema,
  moveTimeSchema,
  obstaclesSchema,
  sharedOpeningSchema,
  stoneSchema,
  timeoutPenaltySchema,
  variantSchema,
} from "@/lib/history/gameSettingsSchema";
import { matchPath } from "@/lib/gomoku/slugs";
import { createLiveGame } from "@/lib/history/liveGame";
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/api/rateLimit";

const liveGameSchema = z.object({
  blackName: z.string().max(PLAYER_NAME_MAX).default(""),
  whiteName: z.string().max(PLAYER_NAME_MAX).default(""),
  size: boardSizeSchema.default(DEFAULT_SETTINGS.size),
  variant: variantSchema,
  obstacles: obstaclesSchema,
  opening: sharedOpeningSchema,
  handicap: handicapSchema,
  moveTimeMs: moveTimeSchema,
  timeoutPenalty: timeoutPenaltySchema,
  opener: stoneSchema.default(STONES.black),
});

/**
 * Starts a game two people can play from different devices.
 *
 * The response carries a token per seat. There is no sign-in here, so the
 * token *is* the seat: whoever holds the link plays that colour. They are
 * returned exactly once, to whoever set the game up, to hand out.
 */
export async function POST(request: Request) {
  try {
    const limited = checkRateLimit(
      `live:${getClientIp(request)}`,
      RATE_LIMITS.createGame,
    );
    if (!limited.allowed) return createRateLimitResponse(limited);

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = liveGameSchema.safeParse(body);
    if (!parsed.success) {
      return unprocessable("That game could not be started.", parsed.error.issues);
    }

    const created = await createLiveGame({
      ...parsed.data,
      handicap: parsed.data.handicap ?? NO_HANDICAP,
      winLength: VARIANT_SPECS[parsed.data.variant].winLength ?? DEFAULT_SETTINGS.winLength,
    });

    return NextResponse.json(created, {
      status: 201,
      headers: { ...NO_STORE, Location: matchPath(parsed.data.variant, created.id) },
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not start that game.");
  }
}
