import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { currentEmail } from "@/lib/auth/currentSession";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat } from "@/lib/history/seats";
import { prisma } from "@/lib/prisma";
import { overLimit } from "@/lib/api/rateLimit";

const bodySchema = z.object({ verdict: z.enum(["up", "down"]).nullable() });

/**
 * A seat's private read on its own play, once the game is over: thumbs up,
 * thumbs down, or taken back. Nobody else sees it; it is for the player's own
 * record of how they felt they did, which is not the same as who won.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/verdict">) {
  try {
    const tooMany = overLimit(request, "verdict");
    if (tooMany !== null) return tooMany;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Up, down, or neither.");

    const { id } = await ctx.params;
    const claim = await resolveSeat(id, (await cookies()).get(seatCookieName(id))?.value, await currentEmail());
    if (claim === null) return NextResponse.json({ error: "You did not hold a seat in this game." }, { status: 403, headers: NO_STORE });
    const row = await prisma.game.findUnique({ where: { id }, select: { status: true } });
    if (row === null) return notFound();
    if (row.status !== "finished") return NextResponse.json({ error: "Wait until the game is over." }, { status: 409, headers: NO_STORE });

    await prisma.game.update({
      where: { id },
      data: claim.seat === STONES.black ? { blackVerdict: parsed.data.verdict } : { whiteVerdict: parsed.data.verdict },
    });
    return NextResponse.json({ ok: true, verdict: parsed.data.verdict }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not record that.");
  }
}
