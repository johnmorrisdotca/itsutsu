import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { setTableColour } from "@/lib/party/online/server/tableColour";
import { PIECE_COLOUR_LIST, type PieceColour } from "@/lib/pieces/pieceColours";
import { tableRefusalWords } from "@/lib/pieces/tableColours";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

const bodySchema = z.object({ colour: z.enum(PIECE_COLOUR_LIST as [string, ...string[]]).nullable() });

/** A member at a table chooses the colour of their own marbles (`setTableColour`). */
export async function POST(request: Request, ctx: RouteContext<"/api/tables/[id]/colour">) {
  try {
    const tooMany = overLimit(request, "table-colour", RATE_LIMITS.write);
    if (tooMany !== null) return tooMany;
    const readerId = await currentMemberId();
    if (readerId === null) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    const body = await readJson(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("A colour from the palette, or null.");
    const { id } = await ctx.params;
    const outcome = await setTableColour(id, readerId, parsed.data.colour as PieceColour | null);
    if (outcome === "none") return notFound("No such table, or no seat of yours at it.");
    if (outcome === "over") return NextResponse.json({ error: "That table is over." }, { status: 409, headers: NO_STORE });
    if (typeof outcome === "object") {
      return NextResponse.json({ error: tableRefusalWords(outcome.refused, await currentSpeaker()), reason: "refused", offer: outcome.refused.offer }, { status: 409, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that colour.");
  }
}
