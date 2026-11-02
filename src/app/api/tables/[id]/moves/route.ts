import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, NO_STORE, readJson, refuse, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { moveAtTable } from "@/lib/party/online/server/tableMove";
import { said } from "@/lib/api/refusal";

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
    if (readerId === null) return refuse(401, "err.table.signInPlay", undefined, { headers: NO_STORE });
    const body = await readJson(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("err.table.moveShape");
    const { id } = await ctx.params;
    const answer = await moveAtTable(id, readerId, parsed.data);
    if ("ok" in answer) return NextResponse.json(answer.ok, { headers: NO_STORE });
    return NextResponse.json({ ...said(answer.refused.code, answer.refused.values), table: answer.table ?? null }, { status: answer.status, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("err.table.moveFailed");
  }
}
