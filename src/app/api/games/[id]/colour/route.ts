import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { setSeatColour } from "@/lib/history/seatColour";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat } from "@/lib/history/seats";
import { PIECE_COLOUR_LIST } from "@/lib/pieces/pieceColours";
import { refusalWords } from "@/lib/pieces/seatColours";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

const bodySchema = z.object({
  token: z.string().min(1).max(128).optional(),
  // A colour from the palette, or null to go back to the reader's own stones.
  colour: z.enum(PIECE_COLOUR_LIST as [string, ...string[]]).nullable(),
});

/**
 * A seat chooses the colour of its pieces in a live game (`setSeatColour`).
 *
 * The seat is proved the way every seat is here: a token in the body, the seat
 * cookie for this match, or the account holding it (`resolveSeat`). Only one's
 * own seat: nobody chooses the other player's colour for them.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/colour">) {
  try {
    const tooMany = overLimit(request, "seat-colour");
    if (tooMany !== null) return tooMany;
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.game.colourChoice");

    const { id } = await ctx.params;
    const claim = await resolveSeat(id, parsed.data.token ?? (await cookies()).get(seatCookieName(id))?.value, await currentMemberId());
    if (claim === null) {
      return refuse(403, "err.game.notSeated", undefined, { reason: "wrong-token", headers: NO_STORE });
    }
    const outcome = await setSeatColour(id, claim.seat, parsed.data.colour as Parameters<typeof setSeatColour>[2]);
    if (outcome.ok) return NextResponse.json({ colours: outcome.colours }, { status: 200, headers: NO_STORE });
    if (outcome.reason === "refused") {
      return NextResponse.json({ error: refusalWords(outcome.refusal, await currentSpeaker()), reason: "refused", offer: outcome.refusal.offer }, { status: 409, headers: NO_STORE });
    }
    return refuse(outcome.reason === "finished" ? 409 : 404, outcome.reason === "finished" ? "err.game.finished" : "err.game.none", undefined, { reason: outcome.reason, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.colourFailed");
  }
}
