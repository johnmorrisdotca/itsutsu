import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { BACKLOG_KIND_VALUES } from "@/lib/backlog/backlog";
import { boardActor } from "@/lib/backlog/boardActor";
import { addItem, fetchBoard } from "@/lib/backlog/backlogStore";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

/**
 * The features board — the operator's, or an agent's holding the board token.
 *
 * Reading it and adding to it were both open to any member, on the argument
 * that a request only the operator can file goes back to living in a chat
 * window. John has decided otherwise, so this is shut: every method here
 * checks `boardActor`, never merely a valid session.
 *
 * The check is here rather than only on the page for the obvious reason. A
 * board hidden from the navigation while its API still answers any signed-in
 * cookie is a board that looks shut and is open, which is worse than either
 * — and this route is the one anybody would try.
 */
const draftSchema = z.object({
  title: z.string(),
  detail: z.string().optional(),
  kind: z.enum(BACKLOG_KIND_VALUES as [string, ...string[]]).optional(),
  askedBy: z.string().optional(),
});

/**
 * The same answer for a stranger, for a member who is simply not the
 * operator, and for a wrong or missing board token: not found. A 403 would
 * confirm the board is there, which is the one thing a refusal should not
 * do — the Admin page has answered this way since it existed.
 */
function notTheOperator() {
  return NextResponse.json({ error: "No such thing." }, { status: 404, headers: NO_STORE });
}

export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "backlog", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const actor = await boardActor(request);
    if (actor === null) return notTheOperator();
    return NextResponse.json({ items: await fetchBoard() }, { headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not read the board.");
  }
}

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "backlog-add");
    if (tooMany !== null) return tooMany;

    const actor = await boardActor(request);
    if (actor === null) return notTheOperator();

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = draftSchema.safeParse(body);
    if (!parsed.success) return badRequest("What is being asked for?");

    const outcome = await addItem(
      {
        title: parsed.data.title,
        detail: parsed.data.detail ?? "",
        kind: (parsed.data.kind ?? "feature") as "feature" | "fix" | "chore",
        askedBy: parsed.data.askedBy?.trim() || actor.name,
      },
      // Only a browser session has a member row behind it to attribute; a
      // token actor is a terminal, not an account here.
      actor.via === "session" ? actor.name : null,
    );
    // The board's own rules say what a usable request is; the route repeats none of them.
    if (!outcome.ok) return unprocessable(outcome.problems[0], outcome.problems);
    return NextResponse.json(outcome.item, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not add that.");
  }
}
