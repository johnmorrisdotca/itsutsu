import { NextResponse } from "next/server";

import { NO_STORE, badRequest, unprocessable, type ApiError } from "@/lib/api/apiResponse";
import { matchPath } from "@/lib/gomoku/slugs";
import type { Against } from "./liveAgainst";
import type { SettingsAsPlayed } from "./liveAsPlayed";
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
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND `Location` NAMES THE GAME AS PLAYED, NOT THE ONE THAT WAS ASKED FOR
 * ─────────────────────────────────────────────────────────────────────────
 *
 * It was built from `asked.data.variant`, which is the variant the CALLER sent
 * — and that is not always the game the row gets written as. A rematch sends no
 * variant at all, so the schema fills in its default of freestyle; a fork sends
 * whatever the screen was showing, and the position it continues overrides it.
 * `liveAsPlayed.ts` is the module that settles which game is actually played,
 * and it spreads the source OVER the request for exactly that reason.
 *
 * So the answer could name a game the row is not: a fork of a freestyle
 * position sent with `variant: "reversi"` answered `/games/reversi/match/<id>`
 * for a game of gomoku. Nothing here reads it — and the match page mends a
 * stale slug by redirecting on the id, which is why this could sit unnoticed —
 * but a header is a report, and a report naming the wrong game is wrong whether
 * or not today's callers happen to read it. See AGENTS.md, "Nothing Answers
 * What It Cannot Answer".
 *
 * The fix is not a second lookup: `played` is the very object `createLiveGame`
 * was handed, so the header and the row are one value said twice and cannot
 * come to disagree.
 */
export function createdResponse({
  created,
  asked,
  against,
  played,
  caller,
}: {
  created: CreatedGame;
  asked: CreationAsked;
  against: Against;
  /** The settings the row was written from, which is what says where it lives. */
  played: SettingsAsPlayed;
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
    headers: { ...NO_STORE, Location: matchPath(played.variant, created.id) },
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
