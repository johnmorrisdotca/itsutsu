import { NextResponse } from "next/server";

import { badRequest, NO_STORE, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberRow } from "@/lib/auth/currentSession";
import { KEPT_ID_PATTERN } from "@/lib/party/kept/kept.constants";
import { readKeptReport } from "@/lib/party/kept/keptReport";
import { keepKeptGame } from "@/lib/party/kept/server/keptTables";

/**
 * A game played on one device, filed in its player's history or brought up to
 * date there (`keptTables.ts`), under the id its browser gave it when it
 * started. Sent when the game starts, ends or is put away, and when its page
 * is left while it is going — never a write a move — and sent again from the
 * device's queue (`keptOutbox.ts`) whenever it was offline. Idempotent: the
 * same report twice is one record. 409 for an id somebody else's record has,
 * so the browser names its game afresh. A visitor's game stays in the browser.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/kept-games/[id]">) {
  try {
    const tooMany = overLimit(request, "kept-game", RATE_LIMITS.keptGame);
    if (tooMany !== null) return tooMany;
    const me = await currentMemberRow();
    if (me === null) return refuse(401, "err.kept.needAccount", undefined, { headers: NO_STORE });

    const { id } = await params;
    if (!KEPT_ID_PATTERN.test(id)) return badRequest("err.kept.badId");
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const report = readKeptReport(body);
    if ("refused" in report) return badRequest(report.refused);
    const written = await keepKeptGame({ id: me.id, name: me.name ?? "" }, id, report);
    if (written === "taken") return refuse(409, "err.kept.otherGame", undefined, { headers: NO_STORE });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.kept.failed");
  }
}
