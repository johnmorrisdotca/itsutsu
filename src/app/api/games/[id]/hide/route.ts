import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ hidden: z.boolean() });

/**
 * Hides a finished game from the signed-in member's own public list, or
 * shows it again. The game still counts in every total and still exists at
 * its address; only the list on the member's player page leaves it out.
 * A seat is proved by the account bound to it.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/hide">) {
  try {
    const me = await currentSession();
    if (!me?.email) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Hidden, or not?");

    const { id } = await ctx.params;
    const row = await prisma.game.findUnique({
      where: { id },
      select: { status: true, blackMember: true, whiteMember: true },
    });
    if (row === null) return notFound();
    if (row.status !== "finished") return NextResponse.json({ error: "Only a finished game can be hidden." }, { status: 409, headers: NO_STORE });
    const colour = row.blackMember === me.email ? "black" : row.whiteMember === me.email ? "white" : null;
    if (colour === null) return NextResponse.json({ error: "You did not hold a seat in this game." }, { status: 403, headers: NO_STORE });

    await prisma.game.update({
      where: { id },
      data: colour === "black" ? { hiddenByBlack: parsed.data.hidden } : { hiddenByWhite: parsed.data.hidden },
    });
    return NextResponse.json({ ok: true, hidden: parsed.data.hidden }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that.");
  }
}
