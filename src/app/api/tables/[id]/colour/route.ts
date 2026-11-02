import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, notFound, readJson, refuse, serverError } from "@/lib/api/apiResponse";
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
    if (readerId === null) return refuse(401, "err.signIn", undefined, { headers: NO_STORE });
    const body = await readJson(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.game.colourChoice");
    const { id } = await ctx.params;
    const outcome = await setTableColour(id, readerId, parsed.data.colour as PieceColour | null);
    if (outcome === "none") return notFound("err.table.noneOrNoSeat");
    if (outcome === "over") return refuse(409, "err.table.over", undefined, { headers: NO_STORE });
    if (typeof outcome === "object") {
      return NextResponse.json({ error: tableRefusalWords(outcome.refused, await currentSpeaker()), reason: "refused", offer: outcome.refused.offer }, { status: 409, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.colourFailed");
  }
}
