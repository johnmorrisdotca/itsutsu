import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, conflict, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import {
  BACKLOG_EFFORT_VALUES,
  BACKLOG_KIND_VALUES,
  BACKLOG_PRIORITY_VALUES,
  BACKLOG_STATUS_VALUES,
} from "@/lib/backlog/backlog";
import { BACKLOG_STATUSES, CLAIMED_BY_MAX } from "@/lib/backlog/backlog.constants";
import { boardActor } from "@/lib/backlog/boardActor";
import { changeItem, finishItem } from "@/lib/backlog/backlogStore";
import type { BacklogChange } from "@/lib/backlog/backlog.types";
import { overLimit } from "@/lib/api/rateLimit";

/** `releasedIn` is a version `pnpm release:take` has just taken, nothing else. */
const SEMVER = /^\d+\.\d+\.\d+$/;

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
 *
 * Who holds a row is not a field a caller sends. In progress is a claim, and
 * a claim is written by the store from the actor this route already knows —
 * see `changeItem` and BOARD_RULES.md invariant 2.
 *
 * `releasedIn`/`releasedAt` are here for exactly one caller: `pnpm
 * release:take`, sending `status: "done"` with the version it just took and
 * the instant it took it. Nothing else may send `done` at all — see the PATCH
 * handler below, which checks the actor and the two fields before `status`
 * ever reaches `changeItem`, where `done` is simply not a destination
 * `STATUS_MOVES` names (board convergence ITS-04).
 */
const patchSchema = z
  .object({
    status: z.enum(BACKLOG_STATUS_VALUES as [string, ...string[]]).optional(),
    title: z.string().optional(),
    detail: z.string().optional(),
    kind: z.enum(BACKLOG_KIND_VALUES as [string, ...string[]]).optional(),
    askedBy: z.string().optional(),
    priority: z.enum(BACKLOG_PRIORITY_VALUES as [string, ...string[]]).nullable().optional(),
    effort: z.enum(BACKLOG_EFFORT_VALUES as [string, ...string[]]).nullable().optional(),
    releasedIn: z.string().optional(),
    releasedAt: z.string().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "empty" });

/**
 * Moves one item to another status, revises what it says, or grades it — any
 * of those, in one write.
 *
 * A move the board's table forbids — a proposal jumping straight to done —
 * answers 422 rather than being written, so the rule holds whatever calls it:
 * the page's select only offers legal moves, and this refuses the rest. So
 * does a detail past the cap, or a title too short to mean anything: the
 * store asks every rule the change touches before it writes, and a request
 * carrying a legal grade and an illegal move leaves the row exactly where it
 * stands rather than half-applied.
 *
 * A move to In progress is a claim, and a live claim somebody else holds
 * answers 409 rather than taking over: BOARD_RULES.md invariant 4, and the
 * reason two sessions built the same thing twice before this ticket. The
 * actor making the move IS the claim — there is no separate "assign to" any
 * more, taking a row and moving it to In progress are the same act, whether
 * the actor is the operator's browser or a terminal holding the board token.
 *
 * The board is the operator's, or an agent's holding the board token. A
 * member's cookie reaches no further here than it does on the board itself:
 * 404, the same answer the address gives them.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/backlog/[id]">) {
  try {
    const tooMany = overLimit(request, "backlog-move");
    if (tooMany !== null) return tooMany;

    const who = await boardActor(request);
    if (who === null) return NextResponse.json({ error: "No such thing." }, { status: 404, headers: NO_STORE });

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest("Move it where, say what, or grade it how?");

    const { id } = await ctx.params;
    const actor = who.name.trim().slice(0, CLAIMED_BY_MAX) || "operator";

    /*
     * `done` is the release tool's alone (BOARD_RULES.md invariant 9). Every
     * check here runs before `finishItem` is ever called, so a wrong actor or
     * a missing field never reaches the store at all — same discipline as
     * `changeItem`'s own "refused whole, not half-applied".
     */
    if (parsed.data.status === BACKLOG_STATUSES.done) {
      if (who.via !== "token") {
        return unprocessable("Only the release tool may mark a row done.");
      }
      const { releasedIn, releasedAt } = parsed.data;
      if (releasedIn === undefined || releasedAt === undefined) {
        return unprocessable("A move to done needs releasedIn and releasedAt.");
      }
      if (!SEMVER.test(releasedIn)) {
        return unprocessable("releasedIn must be a version like 1.2.3.");
      }
      const at = new Date(releasedAt);
      if (Number.isNaN(at.getTime())) return badRequest("releasedAt must be a valid date.");

      const finished = await finishItem(id, { version: releasedIn, at }, actor);
      if (!finished.ok) {
        if (finished.reason === "missing") return notFound("No such item.");
        if (finished.reason === "held") return conflict(`Held by ${finished.heldBy}. Ask them to release it.`);
        return unprocessable(finished.problems[0], finished.problems);
      }
      return NextResponse.json(finished.item, { headers: NO_STORE });
    }

    // The enums are checked above; the lengths and the move are the store's to refuse.
    const outcome = await changeItem(id, parsed.data as BacklogChange, actor);
    if (!outcome.ok) {
      if (outcome.reason === "missing") return notFound("No such item.");
      if (outcome.reason === "held") return conflict(`Held by ${outcome.heldBy}. Ask them to release it.`);
      return unprocessable(outcome.problems[0], outcome.problems);
    }
    return NextResponse.json(outcome.item, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not change that item.");
  }
}
