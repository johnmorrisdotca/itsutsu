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
import { updateLiveGameSettings } from "@/lib/history/liveGameSettings";
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

/**
 * The parsed settings, narrowed to the keys the request actually carried.
 *
 * Zod fills an absent field with its default, so by the time a payload has
 * been parsed there is no longer any difference between "put this back to
 * fifteen" and "I said nothing about the board". The raw body still knows,
 * and this is the only place that still has it. Validation is untouched;
 * what changes is that silence now means "leave it".
 */
function named<T extends object>(body: unknown, settings: T): Partial<T> {
  if (body === null || typeof body !== "object") return {};
  const keys = new Set(Object.keys(body));
  return Object.fromEntries(
    Object.entries(settings).filter(([key]) => keys.has(key)),
  ) as Partial<T>;
}

const REFUSAL_STATUS: Record<string, number> = {
  "not-found": 404,
  finished: 409,
  "wrong-token": 403,
  started: 409,
  settled: 409,
  /*
   * 409 with the other two, because it is the same kind of answer: the request
   * is sound and the game's own state is what refuses it. Not 422 — nothing in
   * the payload is malformed, and a caller told "unprocessable" would go looking
   * at the variant it sent rather than at the game it sent it to.
   */
  "different-game": 409,
};

const REFUSAL_MESSAGE: Record<string, string> = {
  "not-found": "No such game.",
  finished: "That game is already over.",
  "wrong-token": "That link does not hold a seat in this game.",
  started: "The first stone is down, so the rules are fixed.",
  settled: "Somebody has taken the other seat, so the rules are what they agreed to.",
  "different-game":
    "The game is in this match's address, so it cannot be changed. Cancel this board and set up the game you want.",
};

/**
 * Changes the rules of a shared game before it starts. Either seat may, since
 * both are about to play under them; nobody may once a stone is on the board,
 * and nobody may change the GAME at any point — that one is in the address, so
 * moving it would leave every link, seat token and history row carrying its
 * name pointing at something else. See `changesTheGame`.
 *
 * Nothing on the site calls this any more: the panel beside a board has been a
 * statement rather than a form since 0.163.0, and every rule is agreed on the
 * doorstep before a game is written. That is the reason the refusals here are
 * the ones that matter — a route whose only callers are scripts is a route
 * whose checks are the whole of its manners.
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
     * Only what the body named, and no winLength at all.
     *
     * Every field in the schema carries a default, which is right for making
     * a game and wrong for changing one: the parse cannot tell a caller who
     * asked for the default from one who said nothing. The game's own values
     * are the answer to what was not said, and only `updateLiveGameSettings`
     * is holding the row to read them from.
     */
    const asked = named(body, { ...settings, handicap: handicap ?? NO_HANDICAP });
    const outcome = await updateLiveGameSettings(id, token, asked);

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
