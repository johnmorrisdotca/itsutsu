import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { HOUSEKI_CAMPAIGN_LIST, HOUSEKI_KIND_LIST } from "@/lib/houseki/houseki.constants";
import { HOUSEKI_SAVE_LONGEST } from "@/lib/houseki/housekiVerify";
import { recordHousekiWin } from "@/lib/houseki/server/housekiWin";
import type { HousekiKind, HousekiRequest } from "@/lib/houseki/houseki.types";

/**
 * A won Houseki level, or a finished Daily, handed in once.
 *
 * THE ONE THING THE SERVER DOES FOR A HOUSEKI GAME. Everything of play ran in the
 * browser; what arrives here is the finished game's own save, and the whole of
 * the server's work is to play it again from its start (`verifyHousekiWin`) and
 * see that it is the level asked for and that it was won. A member is paid for a
 * game that is WON on the board the package gives that level, never for one that
 * was posted: 422 says why not, and writes nothing.
 *
 * Trust, said plainly: a winning sequence for a level is found by playing it, and a
 * member who reads the package's recorded plan out of its levels has played the
 * level with someone else's solution. That is the same trust a puzzle's answer has
 * (`/api/puzzles/solved`); what is refused here is a game that is not won, a level
 * that is not one the package has, a stranger, and a lesson or a free game, which
 * pay nothing.
 */
const bodySchema = z.object({
  kind: z.enum(HOUSEKI_KIND_LIST as [HousekiKind, ...HousekiKind[]]),
  request: z.union([
    z.object({ kind: z.literal("level"), campaign: z.enum(HOUSEKI_CAMPAIGN_LIST as [string, ...string[]]), number: z.number().int().min(1).max(100) }),
    z.object({ kind: z.literal("daily") }),
  ]),
  save: z.string().min(1).max(HOUSEKI_SAVE_LONGEST),
});

/** What each refusal says, in the words the page shows beside "this win was not counted". */
const REFUSALS = {
  "not-counted": "err.houseki.notCounted",
  "not-a-game": "err.houseki.notAGame",
  "no-daily": "err.houseki.noDaily",
  "no-such-level": "err.houseki.noLevel",
  "not-that-level": "err.houseki.notThatLevel",
  "not-won": "err.houseki.notWon",
  "not-today": "err.houseki.notToday",
  "daily-not-finished": "err.houseki.dailyNotFinished",
  "would-not-replay": "err.houseki.wouldNotReplay",
} as const;

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "houseki-win", RATE_LIMITS.housekiWin);
    if (tooMany !== null) return tooMany;
    const memberId = await currentMemberId();
    if (memberId === null) return refuse(401, "err.houseki.needAccount", undefined, { headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.houseki.shape");
    const asked = parsed.data.request as HousekiRequest;
    const result = await recordHousekiWin(memberId, parsed.data.kind, asked, parsed.data.save);
    if (!result.ok) return unprocessable(REFUSALS[result.why]);
    return NextResponse.json({ ok: true, ip: result.ip, first: result.first }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.houseki.recordFailed");
  }
}
