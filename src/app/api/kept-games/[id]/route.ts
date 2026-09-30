import { NextResponse } from "next/server";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
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
    if (me === null) return NextResponse.json({ error: "Keeping a game in your history needs an account." }, { status: 401, headers: NO_STORE });

    const { id } = await params;
    if (!KEPT_ID_PATTERN.test(id)) return badRequest("Not a kept game's id.");
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const report = readKeptReport(body);
    if ("refused" in report) return badRequest(report.refused);
    const written = await keepKeptGame({ id: me.id, name: me.name ?? "" }, id, report);
    if (written === "taken") return NextResponse.json({ error: "That id is another game's." }, { status: 409, headers: NO_STORE });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not keep that game.");
  }
}
