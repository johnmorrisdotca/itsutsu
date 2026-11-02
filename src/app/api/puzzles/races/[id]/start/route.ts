import { NextResponse } from "next/server";

import { NO_STORE, notFound, refuse, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { raceFor, seatOf, startSeat } from "@/lib/puzzles/server/puzzleRaces";

/** A seat presses Start: the server's clock starts for it, once. */
export async function POST(request: Request, ctx: RouteContext<"/api/puzzles/races/[id]/start">) {
  try {
    const tooMany = overLimit(request, "puzzle-race-start");
    if (tooMany !== null) return tooMany;
    const { id } = await ctx.params;
    const race = await raceFor(id);
    if (race === null) return notFound();
    const seat = seatOf(race, await currentMemberId());
    if (seat === null) return refuse(403, "err.race.notIn", undefined, { headers: NO_STORE });
    const started = await startSeat(id, seat);
    if (started === "none") return notFound();
    return NextResponse.json({ ok: true, seat, started: started === "started" }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.race.startFailed");
  }
}
