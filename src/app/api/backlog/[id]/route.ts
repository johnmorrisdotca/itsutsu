import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { BACKLOG_EFFORT_VALUES, BACKLOG_PRIORITY_VALUES, BACKLOG_STATUS_VALUES } from "@/lib/backlog/backlog";
import { ASSIGNED_TO_MAX } from "@/lib/backlog/backlog.constants";
import { editItem, moveItem } from "@/lib/backlog/backlogStore";
import type { BacklogEdit, BacklogStatus } from "@/lib/backlog/backlog.types";
import { overLimit } from "@/lib/api/rateLimit";

/*
 * A partial rather than a union of two shapes. It was one or the other, so
 * grading a row and handing it to somebody took two calls, and adding a third
 * field would have meant a third arm. Every field is optional and at least one
 * must be present, so an empty body is still refused.
 *
 * `null` is a real value for a grade and not the same as leaving it out:
 * omitting it changes nothing, and sending null ungrades the row. There is no
 * other way to take a judgement back.
 */
const patchSchema = z
  .object({
    status: z.enum(BACKLOG_STATUS_VALUES as [string, ...string[]]).optional(),
    assignedTo: z.string().max(ASSIGNED_TO_MAX).optional(),
    priority: z.enum(BACKLOG_PRIORITY_VALUES as [string, ...string[]]).nullable().optional(),
    effort: z.enum(BACKLOG_EFFORT_VALUES as [string, ...string[]]).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "empty" });

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
    if (!parsed.success) return badRequest("Move it where, hand it to whom, or grade it how?");

    const { id } = await ctx.params;
    const { status, ...fields } = parsed.data;

    /*
     * The edit first, then the move. A status that the board's table forbids
     * answers 422 and nothing is written — so a call carrying both a grade and
     * an illegal move leaves the row where it stands, ungraded, rather than
     * half-applied.
     */
    if (status !== undefined) {
      const moved = await moveItem(id, status as BacklogStatus);
      if (!moved.ok) {
        if (moved.reason === "missing") return notFound("No such item.");
        return unprocessable("An item cannot go straight there from where it stands.");
      }
    }
    const outcome =
      Object.keys(fields).length > 0
        ? await editItem(id, fields as BacklogEdit)
        : await moveItem(id, status as BacklogStatus);
    if (outcome.ok) return NextResponse.json(outcome.item, { headers: NO_STORE });
    if (outcome.reason === "missing") return notFound("No such item.");
    return unprocessable("An item cannot go straight there from where it stands.");
  } catch (error) {
    console.error(error);
    return serverError("Could not move that item.");
  }
}
