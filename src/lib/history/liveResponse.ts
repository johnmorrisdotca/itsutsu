import { NextResponse } from "next/server";

import { NO_STORE, badRequest, unprocessable, type ApiError } from "@/lib/api/apiResponse";
import { matchPath } from "@/lib/gomoku/slugs";
import type { Against } from "./liveAgainst";
import type { CreatedGame } from "./liveGame.types";
import type { CreationAsked, CreationRefusal } from "./liveRequest";
import { seatCookieName } from "./seatCookie";
import { callersSeat, creationBody, withholdsASeat, type CreationBody } from "./seatTokens";

/**
 * WHAT THE CALLER OF `POST /api/games/live` IS TOLD.
 *
 * The refusals in the wording and the status each one has always had, and the
 * 201 — which is not simply the game: it carries seat keys, and a seat key is
 * the whole credential for playing that colour, so which of them the answer may
 * hold is a security decision rather than a formatting one. The rule itself, its
 * three cases and the two bugs that wrote it are in `seatTokens.ts`; this is
 * where it is asked and where the answer is assembled.
 */

/** How long a claimed seat is remembered. */
const SEAT_COOKIE_DAYS = 30;

/**
 * A refusal turned into the answer it has always been.
 *
 * The two 400s go through `badRequest` and the 422 through `unprocessable`,
 * which set no `Cache-Control`; every other refusal this route gives sets
 * `no-store`. That difference is inherited rather than chosen — it is what the
 * route did before this was a function — and it is written out here rather than
 * smoothed over, because smoothing it over would be a change to the wire nobody
 * asked for.
 */
export function refusalResponse(refused: CreationRefusal): NextResponse<ApiError> {
  if (refused.status === 400) return badRequest(refused.error);
  if (refused.status === 422) return unprocessable(refused.error, refused.issues);
  return NextResponse.json({ error: refused.error }, { status: refused.status, headers: NO_STORE });
}

/**
 * The 201 for a game that was made: its body, where it is, and the browser's
 * claim on it where the board is one screen.
 *
 * `offeredSeat` rather than the offer columns for the offered case: the thing
 * that says a seat is actually being withheld is the seat, and an empty `offer`
 * and a null `offeredSeat` are the same fact stated twice.
 */
export function createdResponse({
  created,
  asked,
  against,
  caller,
}: {
  created: CreatedGame;
  asked: CreationAsked;
  against: Against;
  /** The member asking, or null for a browser with no account. */
  caller: string | null;
}): NextResponse<CreationBody> {
  const { hotSeat, seats, offeredSeat } = against;
  const withheld = withholdsASeat({
    hotSeat,
    posted: asked.data.open === true,
    offered: offeredSeat !== null,
    seats,
    caller,
  });
  const response = NextResponse.json(creationBody(created, withheld, callersSeat(seats, caller)), {
    status: 201,
    headers: { ...NO_STORE, Location: matchPath(asked.data.variant, created.id) },
  });
  // A hot-seat game is claimed by the browser that started it, here and now.
  if (hotSeat) {
    response.cookies.set({
      name: seatCookieName(created.id),
      value: created.blackToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SEAT_COOKIE_DAYS * 24 * 60 * 60,
    });
  }
  return response;
}
