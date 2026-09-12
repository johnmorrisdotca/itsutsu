import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, readJson, serverError } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import {
  completedPhrase,
  drop,
  freshTicket,
  keep,
  readTicket,
  reroll,
  sealTicket,
  type PickState,
} from "@/lib/phrase/pickTicket";

/**
 * The picker: four words offered, one kept, four times over.
 *
 * ONE ENDPOINT FOR EVERY MOVE IN THE PICK — start, keep, reroll, take one back
 * — because they are all the same thing: here is where I am, give me the next
 * four words. The state travels in a signed ticket and is never stored, so this
 * route has nowhere to keep a half-finished pick and does not need one.
 *
 * NOTHING IS PERSISTED BY THIS ROUTE. Not the candidates, not the picks, not how
 * many times somebody asked. There is no column and no log line, so there is
 * nothing for anybody to read back afterwards — which is also why rerolling is
 * free: an attacker cannot see a reroll, so it cannot cost anything.
 *
 * WHY A SIGNED TICKET RATHER THAN TRUSTING THE BROWSER. If a request could name
 * four words of its own, the strength of the phrase would be whatever a person
 * happened to choose, and people choose badly — the picker's whole claim is that
 * an attacker does not know WHICH four words were offered. The signature is what
 * lets the server say it offered them.
 */
const drawSchema = z
  .object({
    /** The pick so far. Absent starts a new one. */
    ticket: z.string().max(4096).optional(),
    /** Keep the word at this position in the current offer. */
    keep: z.number().int().min(0).max(64).optional(),
    /** Take the word in this slot back out. */
    drop: z.number().int().min(0).max(64).optional(),
  })
  /*
   * One instruction at a time. "Keep the third and drop the first" has no
   * obvious order and no reason to exist; refusing it is cheaper than deciding
   * what it would mean.
   */
  .refine((body) => body.keep === undefined || body.drop === undefined, {
    message: "Keep a word or take one back, not both at once.",
  });

export async function POST(request: Request) {
  try {
    const tooMany = overLimit(request, "phrase-draw", RATE_LIMITS.phraseDraw);
    if (tooMany !== null) return tooMany;

    /*
     * A phrase belongs to the account setting it, so the pick is tied to that
     * member's id and the ticket carries it. This is what stops one MEMBER's
     * pick being driven into another member's account.
     *
     * The operator is the one exception, and it is a separate route rather than
     * a flag here: `/api/admin/members/[id]/phrase/draw` names the member in
     * its path and proves `currentAdmin()`. This comment used to say a parent
     * setting a child's words was ruled out by name; John asked for exactly
     * that, for his daughter's account at the kitchen table, and the answer was
     * a door with the operator's own lock on it — not a loosening of this one.
     */
    const me = await currentMemberId();
    if (me === null) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    }

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = drawSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "That is not a pick.");

    const state = await nextState(parsed.data, me);
    /*
     * A ticket that does not verify is refused rather than quietly started over.
     * Starting fresh would throw away four words somebody had already chosen and
     * look like the site forgetting them, and on the other side it would let an
     * altered ticket pass as a new pick.
     */
    if (state === null) {
      return NextResponse.json(
        { error: "That pick has expired. Start again — it takes half a minute." },
        { status: 409, headers: NO_STORE },
      );
    }

    const ticket = await sealTicket(state);
    if (ticket === null) return serverError("This site cannot set a phrase: no signing secret.");

    /*
     * The slots and the offer go back in plain sight, and that is the design
     * rather than a leak: the words have to be on screen for somebody to choose
     * them and to write them down. They are never logged, never put in an
     * address, and once the phrase is set they cannot be shown again.
     */
    return NextResponse.json(
      {
        slots: state.slots,
        offered: state.offered,
        done: completedPhrase(state) !== null,
        ticket,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    /*
     * The error and never the body. A body here holds words somebody is about to
     * make their password, and a stack trace in a log is somewhere they must not
     * be.
     */
    console.error(error);
    return serverError("Could not offer any words.");
  }
}

/** Where the pick goes next, or null when the ticket cannot be trusted. */
async function nextState(
  asked: { ticket?: string; keep?: number; drop?: number },
  member: string,
): Promise<PickState | null> {
  if (asked.ticket === undefined) return freshTicket(member);

  const state = await readTicket(asked.ticket, member);
  if (state === null) return null;
  if (asked.keep !== undefined) return keep(state, asked.keep);
  if (asked.drop !== undefined) return drop(state, asked.drop);
  return reroll(state);
}
