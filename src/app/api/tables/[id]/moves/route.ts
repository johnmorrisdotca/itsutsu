import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { moveAtTable } from "@/lib/party/online/server/tableMove";

/**
 * A move at a table, from the page of the seat whose turn it is — or, for a
 * computer's seat, from the page of a member at the table that worked it out.
 * `moves` is how many moves the game the page was drawn from had. The answer is the new table,
 * which the page takes as its own copy; a refusal carries the table as it
 * stands where the page was behind. Every check is `moveAtTable`'s.
 */
const bodySchema = z.object({
  moves: z.number().int().min(0),
  seat: z.number().int().min(0).max(7),
  move: z.unknown(),
});

export async function POST(request: Request, ctx: RouteContext<"/api/tables/[id]/moves">) {
  try {
    const tooMany = overLimit(request, "table-move", RATE_LIMITS.playMove);
    if (tooMany !== null) return tooMany;
    const readerId = await currentMemberId();
    if (readerId === null) return NextResponse.json({ error: "Sign in to play." }, { status: 401, headers: NO_STORE });
    const body = await readJson(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("How many moves the page had seen, a seat and a move.");
    const { id } = await ctx.params;
    const answer = await moveAtTable(id, readerId, parsed.data);
    if ("ok" in answer) return NextResponse.json(answer.ok, { headers: NO_STORE });
    return NextResponse.json({ error: answer.refused, table: answer.table ?? null }, { status: answer.status, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not make that move.");
  }
}
