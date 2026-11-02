import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, notFound, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { PUZZLE_CODE_LONGEST } from "@/lib/puzzles/puzzles.constants";
import { finishSeat } from "@/lib/puzzles/server/puzzleRaceChecks";
import { raceFor, seatOf } from "@/lib/puzzles/server/puzzleRaces";
import { reasonValue } from "@/lib/puzzles/puzzleReasons";

// The checks this seat spent, which the race's allowance bounds; left out, as by an older browser, none.
const bodySchema = z.object({ answer: z.string().max(PUZZLE_CODE_LONGEST), checksUsed: z.number().int().nonnegative().optional() });

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
    if (seat === null || memberId === null) return refuse(403, "err.race.notIn", undefined, { headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.race.answerShape");
    const result = await finishSeat(id, seat, memberId, parsed.data.answer, parsed.data.checksUsed ?? 0);
    if (!result.ok) return refuse(result.status, "err.puzzle.notSolved", { reason: reasonValue(result) }, { headers: NO_STORE });
    return NextResponse.json({ ok: true, seat, elapsedMs: result.elapsedMs, points: result.points, awards: result.awards, outcome: result.outcome }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.race.finishFailed");
  }
}
