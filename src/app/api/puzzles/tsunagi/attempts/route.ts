import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { countTsunagiAttempt } from "@/lib/puzzles/server/tsunagiRecords";
import { isTsunagiLevel } from "@/lib/puzzles/tsunagi/levels";

/**
 * One more attempt at a Tsunagi level, on the account: sent once when a board
 * is started from empty — the first line drawn, and again after Restart —
 * never while it is played. A visitor's attempts are counted in their browser
 * (`tsunagiKept.ts`), so this answers 401 to nobody signed in and the page
 * carries on.
 */
const bodySchema = z.object({ size: z.number().int(), level: z.number().int() });

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "tsunagi-attempt", RATE_LIMITS.puzzleRun);
    if (tooMany !== null) return tooMany;
    const memberId = await currentMemberId();
    if (memberId === null) return refuse(401, "err.puzzle.attemptNeedsAccount", undefined, { headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.puzzle.tsunagiShape");
    const { size, level } = parsed.data;
    if (!isTsunagiLevel(size, level)) return unprocessable("err.puzzle.noTsunagiLevel", undefined, { level, size });
    const count = await countTsunagiAttempt(memberId, size, level);
    return NextResponse.json({ count }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.puzzle.attemptFailed");
  }
}
