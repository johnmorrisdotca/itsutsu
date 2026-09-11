import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import {
  BACKLOG_EFFORT_VALUES,
  BACKLOG_KIND_VALUES,
  BACKLOG_PRIORITY_VALUES,
  BACKLOG_STATUS_VALUES,
} from "@/lib/backlog/backlog";
import { changeItem } from "@/lib/backlog/backlogStore";
import type { BacklogChange } from "@/lib/backlog/backlog.types";
import { overLimit } from "@/lib/api/rateLimit";

/*
 * A partial rather than a union of shapes. It was one or the other, so grading
 * a row and handing it to somebody took two calls, and adding a third field
 * would have meant a third arm. Every field is optional and at least one must
 * be present, so an empty body is still refused.
 *
 * `null` is a real value for a grade and not the same as leaving it out:
 * omitting it changes nothing, and sending null ungrades the row. There is no
 * other way to take a judgement back.
 *
 * The text of a row — its title, detail, kind and who asked — is here too,
 * because until it was there was no way through the API to correct a row at
 * all, and the way that got taken instead was a script writing to the table.
 * The lengths are not repeated here: the store asks the same `draftProblems`
 * the add route and the form ask, and answers 422 in its words.
 */
const patchSchema = z
  .object({
    status: z.enum(BACKLOG_STATUS_VALUES as [string, ...string[]]).optional(),
    title: z.string().optional(),
    detail: z.string().optional(),
    kind: z.enum(BACKLOG_KIND_VALUES as [string, ...string[]]).optional(),
    askedBy: z.string().optional(),
    assignedTo: z.string().optional(),
    priority: z.enum(BACKLOG_PRIORITY_VALUES as [string, ...string[]]).nullable().optional(),
    effort: z.enum(BACKLOG_EFFORT_VALUES as [string, ...string[]]).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "empty" });

/**
 * Moves one item to another status, revises what it says, grades it, or says
 * who has picked it up — any of those, in one write.
 *
 * A move the board's table forbids — a proposal jumping straight to done —
 * answers 422 rather than being written, so the rule holds whatever calls it:
 * the page's select only offers legal moves, and this refuses the rest. So
 * does a detail past the cap, or a title too short to mean anything: the
 * store asks every rule the change touches before it writes, and a request
 * carrying a legal grade and an illegal move leaves the row exactly where it
 * stands rather than half-applied.
 *
 * The board is the operator's, so changing a row is the operator's too. A
 * member's cookie reaches no further here than it does on the board itself:
 * 404, the same answer the address gives them.
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
    if (!parsed.success) return badRequest("Move it where, say what, hand it to whom, or grade it how?");

    const { id } = await ctx.params;
    // The enums are checked above; the lengths and the move are the store's to refuse.
    const outcome = await changeItem(id, parsed.data as BacklogChange);
    if (!outcome.ok) {
      if (outcome.reason === "missing") return notFound("No such item.");
      return unprocessable(outcome.problems[0], outcome.problems);
    }
    return NextResponse.json(outcome.item, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that item.");
  }
}
