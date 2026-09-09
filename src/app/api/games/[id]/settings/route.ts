import { NextResponse } from "next/server";
import { z } from "zod";

import {
  NO_STORE,
  badRequest,
  readJson,
  serverError,
  unprocessable,
} from "@/lib/api/apiResponse";
import { DEFAULT_SETTINGS, NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import {
  boardSizeSchema,
  handicapSchema,
  moveTimeSchema,
  obstaclesSchema,
  sharedOpeningSchema,
  timeoutPenaltySchema,
  variantSchema,
  drawLimitSchema,
} from "@/lib/history/gameSettingsSchema";
import { updateLiveGameSettings } from "@/lib/history/liveGame";
import { overLimit } from "@/lib/api/rateLimit";

const settingsSchema = z.object({
  token: z.string().min(1).max(128),
  size: boardSizeSchema.default(DEFAULT_SETTINGS.size),
  variant: variantSchema,
  obstacles: obstaclesSchema,
  opening: sharedOpeningSchema,
  handicap: handicapSchema,
  moveTimeMs: moveTimeSchema,
  timeoutPenalty: timeoutPenaltySchema,
  allowResign: z.boolean().default(true),
  drawLimit: drawLimitSchema,
  clockMode: z.enum(["move", "game"]).default("move"),
  rated: z.boolean().default(true),
  open: z.boolean().default(false),
});

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  started: 409,
  settled: 409,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "That link does not hold a seat in this game.",
  started: "The first stone is down, so the rules are fixed.",
  settled: "Somebody has taken the other seat, so the rules are what they agreed to.",
};

/**
 * Changes the rules of a shared game before it starts. Either seat may, since
 * both are about to play under them; nobody may once a stone is on the board.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/games/[id]/settings">,
) {
  try {
    const tooMany = overLimit(request, "game-settings");
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return unprocessable("Those rules could not be applied.", parsed.error.issues);
    }

    const { id } = await ctx.params;
    const { token, handicap, ...settings } = parsed.data;
    /*
     * No winLength: the game keeps the line it is being played to, and a
     * variant that fixes one still wins. Deciding it here meant deciding it
     * without the row in hand, so the only answer available was a default —
     * and a default overwrote whatever the game had actually been set to.
     */
    const outcome = await updateLiveGameSettings(id, token, {
      ...settings,
      handicap: handicap ?? NO_HANDICAP,
    });

    if (!outcome.ok) {
      return NextResponse.json(
        { error: REFUSAL_MESSAGE[outcome.reason], reason: outcome.reason },
        { status: REFUSAL_STATUS[outcome.reason] ?? 400, headers: NO_STORE },
      );
    }
    return NextResponse.json(outcome.game, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change those rules.");
  }
}
