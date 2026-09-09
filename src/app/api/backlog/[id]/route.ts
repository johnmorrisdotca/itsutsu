import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { BACKLOG_STATUS_VALUES } from "@/lib/backlog/backlog";
import { ASSIGNED_TO_MAX } from "@/lib/backlog/backlog.constants";
import { assignItem, moveItem } from "@/lib/backlog/backlogStore";
import type { BacklogStatus } from "@/lib/backlog/backlog.types";
import { overLimit } from "@/lib/api/rateLimit";

const patchSchema = z.union([
  z.object({ status: z.enum(BACKLOG_STATUS_VALUES as [string, ...string[]]) }),
  z.object({ assignedTo: z.string().max(ASSIGNED_TO_MAX) }),
]);

/**
 * Moves one item to another status, or says who has picked it up.
 *
 * A move the board's table forbids — a proposal jumping straight to done —
 * answers 422 rather than being written, so the rule holds whatever calls it:
 * the page's select only offers legal moves, and this refuses the rest.
 *
 * The board is the operator's, so moving a row and handing it to somebody are
 * the operator's too. A member's cookie reaches no further here than it does
 * on the board itself: 404, the same answer the address gives them.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/backlog/[id]">) {
  try {
    const tooMany = overLimit(request, "backlog-move");
    if (tooMany !== null) return tooMany;

    const me = await currentAdmin();
    if (me === null) return NextResponse.json({ error: "No such thing." }, { status: 404, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Move it to which status, or hand it to whom?");

    const { id } = await ctx.params;
    const outcome =
      "assignedTo" in parsed.data
        ? await assignItem(id, parsed.data.assignedTo)
        : await moveItem(id, parsed.data.status as BacklogStatus);
    if (outcome.ok) return NextResponse.json(outcome.item, { headers: NO_STORE });
    if (outcome.reason === "missing") return notFound("No such item.");
    return unprocessable("An item cannot go straight there from where it stands.");
  } catch (error) {
    console.error(error);
    return serverError("Could not move that item.");
  }
}
