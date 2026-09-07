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
  BOARD_SIZES,
  OBSTACLE_LAYOUTS,
  RULE_VARIANTS,
  STONES,
  WIN_LENGTH,
} from "@/lib/gomoku/gomoku.constants";
import { PLAYER_NAME_MAX } from "@/lib/history/gameHistory.constants";
import { createLiveGame } from "@/lib/history/liveGame";

const liveGameSchema = z.object({
  blackName: z.string().max(PLAYER_NAME_MAX).default(""),
  whiteName: z.string().max(PLAYER_NAME_MAX).default(""),
  size: z
    .number()
    .int()
    .refine((size) => (BOARD_SIZES as readonly number[]).includes(size), {
      message: "Not a board size this game offers.",
    })
    .default(15),
  variant: z
    .enum([RULE_VARIANTS.freestyle, RULE_VARIANTS.standard])
    .default(RULE_VARIANTS.freestyle),
  obstacles: z
    .enum([OBSTACLE_LAYOUTS.none, OBSTACLE_LAYOUTS.hoshi])
    .default(OBSTACLE_LAYOUTS.none),
  opener: z.enum([STONES.black, STONES.white]).default(STONES.black),
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
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");

    const parsed = liveGameSchema.safeParse(body);
    if (!parsed.success) {
      return unprocessable("That game could not be started.", parsed.error.issues);
    }

    const created = await createLiveGame({
      ...parsed.data,
      winLength: WIN_LENGTH,
    });

    return NextResponse.json(created, {
      status: 201,
      headers: { ...NO_STORE, Location: `/g/${created.id}` },
    });
  } catch (error) {
    console.error(error);
    return serverError("Could not start that game.");
  }
}
