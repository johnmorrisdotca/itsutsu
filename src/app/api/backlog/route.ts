import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { currentSession } from "@/lib/auth/currentSession";
import { BACKLOG_KIND_VALUES } from "@/lib/backlog/backlog";
import { addItem, fetchBoard } from "@/lib/backlog/backlogStore";
import { overLimit, RATE_LIMITS } from "@/lib/api/rateLimit";

/**
 * The features board.
 *
 * Reading it and adding to it are both for anyone who is in — the board is the
 * site's shared answer to "what is next", and a request that only the operator
 * can file is a request that goes back to living in a chat window.
 */
const draftSchema = z.object({
  title: z.string(),
  detail: z.string().optional(),
  kind: z.enum(BACKLOG_KIND_VALUES as [string, ...string[]]).optional(),
  askedBy: z.string().optional(),
});

function signedOut() {
  return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
}

export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "backlog", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    const me = await currentSession();
    if (me === null) return signedOut();
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

    const me = await currentSession();
    if (me === null) return signedOut();

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = draftSchema.safeParse(body);
    if (!parsed.success) return badRequest("What is being asked for?");

    const outcome = await addItem(
      {
        title: parsed.data.title,
        detail: parsed.data.detail ?? "",
        kind: (parsed.data.kind ?? "feature") as "feature" | "fix" | "chore",
        askedBy: parsed.data.askedBy?.trim() || me.name || me.email || "",
      },
      me.email ?? null,
    );
    // The board's own rules say what a usable request is; the route repeats none of them.
    if (!outcome.ok) return unprocessable(outcome.problems[0], outcome.problems);
    return NextResponse.json(outcome.item, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not add that.");
  }
}
