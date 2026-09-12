import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { logOperatorAction } from "@/lib/auth/operatorLog";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { setPhraseAsOperator } from "@/lib/phrase/operatorPhrase";
import { completedPhrase, readTicket } from "@/lib/phrase/pickTicket";

/**
 * The operator setting a member's four words for them.
 *
 * THE THIRD DOOR ONTO ONE STORE. `/api/me/phrase` is the member setting their
 * own; `sit-as` is somebody proving theirs at a board. This is the operator
 * doing it for somebody — the kitchen table, a child's account being set up by
 * the parent sitting beside her — and it writes through `setPhrase` like both
 * of the others. There is no second hashing path and no second column: see
 * `operatorPhrase.ts`, which adds the two refusals this door needs and then
 * hands over.
 *
 * `currentAdmin()`, NOT `currentMemberId()`, and the difference is the whole
 * point of the file. Every other phrase route asks who the caller is and sets
 * the phrase of exactly that person; this one asks whether the caller is the
 * operator and then sets somebody ELSE's, named in the path. `proxy.ts` has
 * already refused anybody with no session at all — this is the narrowing that
 * admin routes do for themselves, the same one `/api/members` does, and a
 * non-operator gets 404 rather than 403 so the route gives away nothing about
 * existing.
 *
 * NOTHING HERE RETURNS OR LOGS THE WORDS. They reach the server inside the
 * signed ticket, are hashed, and are gone. The operator has them on screen
 * while they are being picked — that is the only place they ever exist to be
 * read, which is why the acknowledgement below is refused rather than assumed.
 */

const setSchema = z.object({
  /** The finished pick, signed by us and bound to the member it is for. */
  ticket: z.string().min(1).max(4096),
  /**
   * That the operator has written the four words down FOR THE MEMBER.
   *
   * The member's own route asks the same thing of the member. It matters more
   * here, not less: the person whose account this is is not the person looking
   * at the screen, so if the operator does not write them down there is nobody
   * left who knows them. A hashed phrase cannot be shown again.
   */
  acknowledged: z.literal(true),
  /**
   * That the operator has been told there are already four words on this
   * account, and has said to replace them.
   *
   * Absent means "I did not know", and the route answers 409 rather than
   * writing — see `needs-confirm` in `operatorPhrase.ts`. Optional rather than
   * `z.literal(true)`, because the ordinary call genuinely does not send it and
   * being made to send `false` to set a first phrase would be a field that
   * means nothing.
   */
  replacing: z.literal(true).optional(),
});

export async function PUT(request: Request, ctx: RouteContext<"/api/admin/members/[id]/phrase">) {
  try {
    /*
     * The member's own limit, by name and by config — `phrase` at the ordinary
     * write rate, exactly as `/api/me/phrase` counts it. One bucket rather than
     * a second one for the operator: the key is the caller's address, only an
     * operator reaches this route, and an operator setting words for somebody
     * is doing the same work at the same cost as setting their own. A new limit
     * here would be a second number to keep in step with this one, and a looser
     * one would be a hole in a limit that already exists.
     */
    const tooMany = overLimit(request, "phrase");
    if (tooMany !== null) return tooMany;

    const me = await currentAdmin();
    if (me === null) return notFound();

    const { id } = await ctx.params;

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) {
      // The unticked box gets its own wording, as it does on the member's own
      // route: every other fault here is a client sending nonsense, and this
      // one is a person who has not written the words down for somebody.
      const unacknowledged = parsed.error.issues.some((issue) => issue.path[0] === "acknowledged");
      return badRequest(
        unacknowledged
          ? "Write the four words down to give to this member first, then tick the box."
          : (parsed.error.issues[0]?.message ?? "That is not a finished phrase."),
      );
    }

    /*
     * THE TICKET IS BOUND TO THE MEMBER THE WORDS ARE FOR, so it is read
     * against the id in the path and not against the operator. That is what
     * keeps the ticket's own guarantee intact: the words come out of something
     * this server signed for THIS member, never off the request body, so no
     * caller can name four words of its own however it is authorised.
     */
    const state = await readTicket(parsed.data.ticket, id);
    if (state === null) {
      return NextResponse.json(
        { error: "That pick has expired, or was for somebody else. Choose four words again." },
        { status: 409, headers: NO_STORE },
      );
    }
    const words = completedPhrase(state);
    if (words === null) return unprocessable("That phrase is not finished: four words are needed.");

    const outcome = await setPhraseAsOperator(id, words, { replacing: parsed.data.replacing === true });
    if (!outcome.ok) {
      if (outcome.reason === "no-member") return notFound("No such member.");
      if (outcome.reason === "not-claimable") {
        return unprocessable(
          "That row is not an account anybody signs in to — a kept record, a seeded row or a computer player — so four words would be a way into nobody's account.",
        );
      }
      if (outcome.reason === "needs-confirm") {
        /*
         * 409 and the DATE, which is what makes the question answerable. The
         * flag is what the modal branches on rather than the status, because
         * the expired ticket above is also a 409 and the two need two
         * different things said to the operator.
         */
        return NextResponse.json(
          {
            error: "This member already has four words. Replacing them takes away the ones they have.",
            confirmNeeded: true,
            phraseSetAt: outcome.target.setAt?.toISOString() ?? null,
          },
          { status: 409, headers: NO_STORE },
        );
      }
      return unprocessable("Those are not four words from the list.");
    }

    /*
     * A line the operator can read back later. The member's id and never their
     * words, and it says whether this replaced a credential somebody was
     * already using — which is the half of it worth having a record of.
     */
    logOperatorAction(
      me.email,
      `four words ${outcome.replaced ? "REPLACED" : "set"} for member ${outcome.target.id}` +
        (outcome.replaced && outcome.target.setAt !== null
          ? ` (the ones it replaced were set ${outcome.target.setAt.toISOString()})`
          : ""),
    );

    /*
     * `ok`, whether it replaced, and when. Not the words, not the hash, not an
     * echo of the ticket — the browser has the words on screen already, and
     * everything else this could carry would be a credential in a response
     * body for no reason. The date is what the list shows next to the member
     * once the modal closes.
     */
    return NextResponse.json(
      { ok: true, replaced: outcome.replaced, phraseSetAt: new Date().toISOString() },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    /*
     * The error and never the body: a body here holds four words somebody is
     * about to use as a password.
     */
    console.error(error);
    return serverError("Could not set those words.");
  }
}
