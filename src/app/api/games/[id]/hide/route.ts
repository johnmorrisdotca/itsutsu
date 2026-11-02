import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, notFound, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { currentMemberId } from "@/lib/auth/currentSession";
import { prisma } from "@/lib/prisma";
import { overLimit } from "@/lib/api/rateLimit";

const bodySchema = z.object({ hidden: z.boolean() });

/**
 * Hides a finished game from the signed-in member's own public list, or
 * shows it again. The game still counts in every total and still exists at
 * its address; only the list on the member's player page leaves it out.
 * A seat is proved by the account bound to it.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/hide">) {
  try {
    const tooMany = overLimit(request, "hide-game");
    if (tooMany !== null) return tooMany;

    // A member, by id — whether or not they came in with an address.
    if ((await currentMemberId()) === null) {
      return refuse(401, "err.signIn", undefined, { headers: NO_STORE });
    }
    const body = await readJson(request);
    if (body === undefined) return badRequest("err.badJson");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.game.hideChoice");

    const { id } = await ctx.params;
    const row = await prisma.game.findUnique({
      where: { id },
      select: { status: true, blackMemberId: true, whiteMemberId: true },
    });
    if (row === null) return notFound();
    if (row.status !== "finished") return refuse(409, "err.game.hideFinished", undefined, { headers: NO_STORE });
    const mine = await currentMemberId();
    const colour = mine !== null && row.blackMemberId === mine ? "black" : mine !== null && row.whiteMemberId === mine ? "white" : null;
    if (colour === null) return refuse(403, "err.game.wasNotSeated", undefined, { headers: NO_STORE });

    await prisma.game.update({
      where: { id },
      data: colour === "black" ? { hiddenByBlack: parsed.data.hidden } : { hiddenByWhite: parsed.data.hidden },
    });
    return NextResponse.json({ ok: true, hidden: parsed.data.hidden }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.changeFailed");
  }
}
