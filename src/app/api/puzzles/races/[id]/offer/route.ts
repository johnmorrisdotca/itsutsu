import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, notFound, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberRow } from "@/lib/auth/currentSession";
import { offerRace } from "@/lib/puzzles/server/puzzleRaces";

const bodySchema = z.object({ memberId: z.string().trim().min(1).max(64) });

const REFUSED = {
  notHost: { status: 403, error: "err.race.onlyHost" },
  taken: { status: 409, error: "err.race.seatTaken" },
  notBuddy: { status: 422, error: "err.race.toBuddy" },
} as const;

/** The host offers the other seat to a buddy by name. See `offerRace`. */
export async function POST(request: Request, ctx: RouteContext<"/api/puzzles/races/[id]/offer">) {
  try {
    const tooMany = overLimit(request, "puzzle-race-offer");
    if (tooMany !== null) return tooMany;
    const me = await currentMemberRow();
    if (me === null) return refuse(401, "err.race.needAccount", undefined, { headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.race.offerWho");
    const { id } = await ctx.params;
    const offered = await offerRace(id, { id: me.id, name: me.name ?? "" }, parsed.data.memberId);
    if (offered === "none") return notFound();
    if (offered !== "offered") return refuse(REFUSED[offered].status, REFUSED[offered].error, undefined, { headers: NO_STORE });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.race.offerFailed");
  }
}
