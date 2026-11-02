import { NextResponse } from "next/server";

import { NO_STORE, notFound, refuse, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { giveUpSeat, raceFor, seatOf } from "@/lib/puzzles/server/puzzleRaces";

/** A seat ends unsolved (its guesses ran out): stamped once, so the race settles now. See `giveUpSeat`. */
export async function POST(request: Request, ctx: RouteContext<"/api/puzzles/races/[id]/give-up">) {
  try {
    const tooMany = overLimit(request, "puzzle-race-give-up");
    if (tooMany !== null) return tooMany;
    const { id } = await ctx.params;
    const memberId = await currentMemberId();
    const race = await raceFor(id);
    if (race === null) return notFound();
    const seat = seatOf(race, memberId);
    if (seat === null || memberId === null) return refuse(403, "err.race.notIn", undefined, { headers: NO_STORE });
    const given = await giveUpSeat(id, seat, memberId);
    if (!given.ok) return refuse(given.status, given.code ?? "err.race.giveUpFailed", given.values, { headers: NO_STORE });
    return NextResponse.json({ ok: true, seat, outcome: given.outcome }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.race.giveUpFailed");
  }
}
