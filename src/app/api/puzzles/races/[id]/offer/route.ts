import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberRow } from "@/lib/auth/currentSession";
import { offerRace } from "@/lib/puzzles/server/puzzleRaces";

const bodySchema = z.object({ memberId: z.string().trim().min(1).max(64) });

const REFUSED = {
  notHost: { status: 403, error: "Only the race's host can offer its other seat." },
  taken: { status: 409, error: "The other seat is already taken." },
  notBuddy: { status: 422, error: "A race is offered to one of your buddies." },
} as const;

/** The host offers the other seat to a buddy by name. See `offerRace`. */
export async function POST(request: Request, ctx: RouteContext<"/api/puzzles/races/[id]/offer">) {
  try {
    const tooMany = overLimit(request, "puzzle-race-offer");
    if (tooMany !== null) return tooMany;
    const me = await currentMemberRow();
    if (me === null) return NextResponse.json({ error: "Racing needs an account." }, { status: 401, headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Which member to offer the seat to.");
    const { id } = await ctx.params;
    const offered = await offerRace(id, { id: me.id, name: me.name ?? "" }, parsed.data.memberId);
    if (offered === "none") return notFound();
    if (offered !== "offered") return NextResponse.json({ error: REFUSED[offered].error }, { status: REFUSED[offered].status, headers: NO_STORE });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not offer that race.");
  }
}
