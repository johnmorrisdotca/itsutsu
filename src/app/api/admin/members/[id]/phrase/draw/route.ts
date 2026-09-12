import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { logOperatorAction } from "@/lib/auth/operatorLog";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { phraseTarget } from "@/lib/phrase/operatorPhrase";
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
 * The picker, drawn by the operator for a member.
 *
 * THE SAME PICK AS `/api/me/phrase/draw`, MOVE FOR MOVE: start, keep, reroll,
 * take one back, all through one endpoint, with the whole state in a signed
 * ticket and nothing persisted anywhere. The modal on the Members list shows
 * the same tiles, the same candidates and the same refresh as the member's own
 * Words tab, because it is the same act — so this answers the same shape.
 *
 * THE ONE DIFFERENCE IS WHOSE PICK IT IS. The member's route ties the ticket to
 * `currentMemberId()`: the caller and the subject are the same person, and that
 * is what stops one member driving another member's pick. Here they are not the
 * same person by design, so the tie is to the id in the PATH and the authority
 * to name somebody else is `currentAdmin()`. Neither check is weakened: a
 * ticket still only ever belongs to one member, and only an operator session
 * can ask for one it does not own.
 *
 * NOTHING IS PERSISTED BY THIS ROUTE — not the candidates, not the picks, not
 * how many times anybody looked. There is no row and no log line for a draw, so
 * there is nothing to read back afterwards, which is also why rerolling is free:
 * an attacker cannot see a reroll, so it cannot cost anything.
 *
 * ONE LINE IS LOGGED, ONCE, when an operator OPENS a pick for somebody. That is
 * not the draw being recorded — it is the act of an operator reaching for
 * somebody else's credential, which is worth knowing about even when they think
 * better of it and never press Save. The words are not in it.
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
  .refine((body) => body.keep === undefined || body.drop === undefined, {
    message: "Keep a word or take one back, not both at once.",
  });

export async function POST(request: Request, ctx: RouteContext<"/api/admin/members/[id]/phrase/draw">) {
  try {
    /*
     * THE MEMBER'S OWN LIMIT, NOT A SECOND PAIR — `phraseDraw`, by the same
     * scope name the member's draw counts under, so the operator's draws and
     * their own share one bucket per address. It bounds a COST and not an
     * attack (see `RATE_LIMITS.phraseDraw`): a reroll gives nothing away, and
     * an operator finding four words a child will recognise taps it as often as
     * the child would. Nothing here loosens it and nothing adds to it.
     */
    const tooMany = overLimit(request, "phrase-draw", RATE_LIMITS.phraseDraw);
    if (tooMany !== null) return tooMany;

    const me = await currentAdmin();
    if (me === null) return notFound();

    const { id } = await ctx.params;

    /*
     * The row is checked BEFORE any words are drawn, so an operator cannot get
     * as far as four words for a member that cannot hold them and only be told
     * at Save. `mayHavePhrase` is `canBeClaimed`: a kept record, a seeded row
     * and a computer player are not accounts anybody signs in to, and a phrase
     * on one would be a way into nobody's account.
     */
    const target = await phraseTarget(id);
    if (target === null) return notFound("No such member.");
    if (!target.mayHavePhrase) {
      return unprocessable(
        "That row is not an account anybody signs in to — a kept record, a seeded row or a computer player — so four words would be a way into nobody's account.",
      );
    }

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = drawSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "That is not a pick.");

    const state = await nextState(parsed.data, target.id);
    /*
     * A ticket that does not verify is refused rather than quietly started
     * over: starting fresh would throw away words already chosen and look like
     * the site forgetting them, and on the other side it would let an altered
     * ticket pass as a new pick.
     */
    if (state === null) {
      return NextResponse.json(
        { error: "That pick has expired, or was for somebody else. Start again — it takes half a minute." },
        { status: 409, headers: NO_STORE },
      );
    }

    const ticket = await sealTicket(state);
    if (ticket === null) return serverError("This site cannot set a phrase: no signing secret.");

    // Only the first draw, or every reroll would be a line. Opening a pick for
    // somebody is the act worth recording; the rest of it is one act.
    if (parsed.data.ticket === undefined) {
      logOperatorAction(me.email, `opened a four-word pick for member ${target.id}`);
    }

    /*
     * The slots and the offer go back in plain sight, which is the design
     * rather than a leak: the words have to be on screen for the operator to
     * choose them and to write them down for the member. They are never
     * logged, never put in an address, and once the phrase is set they cannot
     * be shown again to anybody.
     */
    return NextResponse.json(
      {
        slots: state.slots,
        offered: state.offered,
        done: completedPhrase(state) !== null,
        ticket,
        /*
         * What the modal needs in order to ask the replace question honestly,
         * read at the moment the pick opens rather than taken from a list that
         * may be minutes old. The PUT still refuses without the confirm — this
         * is so the operator is asked BEFORE picking four words, not after.
         */
        member: { id: target.id, name: target.name, set: target.set, setAt: target.setAt?.toISOString() ?? null },
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    // The error and never the body: a body here holds words somebody is about
    // to make their password, and a stack trace in a log is somewhere they
    // must not be.
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
