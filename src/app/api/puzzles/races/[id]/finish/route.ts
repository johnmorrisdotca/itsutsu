import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { PUZZLE_CODE_LONGEST } from "@/lib/puzzles/puzzles.constants";
import { finishSeat, raceFor, seatOf } from "@/lib/puzzles/server/puzzleRaces";

const bodySchema = z.object({ answer: z.string().max(PUZZLE_CODE_LONGEST) });

/**
 * A seat hands its answer in. A wrong grid is refused with its reason and
 * the clock runs on; a right one is stamped at the server's now, kept as a
 * solve, and paid. See `finishSeat`.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/puzzles/races/[id]/finish">) {
  try {
    const tooMany = overLimit(request, "puzzle-race-finish", RATE_LIMITS.puzzleSolved);
    if (tooMany !== null) return tooMany;
    const { id } = await ctx.params;
    const memberId = await currentMemberId();
    const race = await raceFor(id);
    if (race === null) return notFound();
    const seat = seatOf(race, memberId);
    if (seat === null || memberId === null) return NextResponse.json({ error: "You are not in this race." }, { status: 403, headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("The answer, as a grid.");
    const result = await finishSeat(id, seat, memberId, parsed.data.answer);
    if (!result.ok) return NextResponse.json({ error: `Not solved: ${result.reason}.` }, { status: result.status, headers: NO_STORE });
    return NextResponse.json({ ok: true, seat, elapsedMs: result.elapsedMs, points: result.points, awards: result.awards, outcome: result.outcome }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not record that finish.");
  }
}
