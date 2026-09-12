import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";
import { claimOrVerifyPhraseFor } from "@/lib/phrase/phraseStore";
import { seatStandIn } from "@/lib/phrase/standInSeat";
import { seatCookieName } from "@/lib/history/seatCookie";

/** How long the board stays hers on this device — the same as any claimed seat. */
const SEAT_COOKIE_DAYS = 30;

/**
 * Taking a seat as somebody else, on a device somebody else is signed in on.
 *
 * THE KITCHEN TABLE. John is signed in on the iPad; his daughter taps her four
 * words and takes the other seat AS HERSELF, so the game is rated, is in her
 * record, and moves her standing. Two accounts, one tablet, and a game that
 * counts for both — which is the whole feature, and is what hot seat
 * deliberately is not.
 *
 * A NAME AND THEN THE WORDS, which is a username and a password. The words
 * cannot find a member on their own: every row's hash is salted, so there is
 * nothing to look up. A name is not a secret and costs nothing to say; the words
 * are what prove it.
 *
 * THE GATE IS NOT TOUCHED. This is a new way to prove who somebody is, and
 * `src/proxy.ts` still decides entirely on its own whether a request gets in at
 * all: this route is under `/api/`, which the gate closes, so a request only
 * arrives here after the gate has already said yes. It cannot turn a no into a
 * yes, because it never runs on a no.
 *
 * EVERY REFUSAL THAT COULD BE A GUESS SAYS THE SAME THING. Wrong name, wrong
 * words, a name nobody here goes by — one message, one status. Telling them
 * apart would make this a way to find out who holds an account.
 */
const sitAsSchema = z.object({
  /** The display name of whoever is sitting down. Not a secret. */
  name: z.string().trim().min(1).max(60),
  /**
   * The four words, tapped rather than typed.
   *
   * Order does not matter and is not checked here: `canonicalPhrase` sorts, and
   * both setting and checking go through it. Length is bounded so a request
   * cannot ask the server to hash a novel.
   */
  words: z.array(z.string().max(32)).min(1).max(PHRASE_LENGTH),
  /** Which seat, when both are free and the player has to say. */
  seat: z.enum([STONES.black, STONES.white]).optional(),
});

/** One wording for every failure that could be somebody guessing. */
const REFUSED = "Those four words do not match that name.";

export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/sit-as">) {
  try {
    /*
     * THE GUESSING LIMIT, and it is what makes a thirty-six-bit credential safe.
     * `strict`, so the end-to-end suite's relief never loosens it. Counted before
     * anything else happens, because the work this route does — an scrypt hash —
     * is the expensive part and a limiter that runs after it has bounded nothing.
     */
    const tooMany = overLimit(request, "phrase-entry", RATE_LIMITS.phraseEntry);
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const body = await readJson(request);
    const parsed = body === undefined ? undefined : sitAsSchema.safeParse(body);
    /*
     * Even a malformed body gets the one refusal. "Three words is not four" is
     * true and harmless on the setup screen, where a person is choosing; here it
     * is a reply to somebody who may be probing, and the fewer different answers
     * this route has, the less it says — so a bad shape answers exactly like a
     * wrong guess rather than explaining what it wanted.
     */
    if (parsed === undefined || !parsed.success) {
      return NextResponse.json({ error: REFUSED }, { status: 401, headers: NO_STORE });
    }

    /*
     * Checked if the account has words, BOUND to it if it has none — see
     * `claimOrVerifyPhraseFor`. Arriving at somebody else's device with no
     * words and no other device was the case this whole feature exists for,
     * and verification alone could not serve it.
     */
    const claim = await claimOrVerifyPhraseFor(parsed.data.name, parsed.data.words);
    if (!claim.ok) {
      return NextResponse.json({ error: REFUSED }, { status: 401, headers: NO_STORE });
    }
    const memberId = claim.memberId;

    const outcome = await seatStandIn(id, memberId, parsed.data.name, parsed.data.seat);
    if (!outcome.ok) return refusal(outcome.reason, outcome.said);

    const response = NextResponse.json(
      /*
       * `bound` says these four words are NEW to this account, so the screen
       * can tell somebody they now have a way back in rather than letting them
       * discover it. It reports what happened; it grants nothing.
       */
      { path: matchPath(outcome.variant, id), seat: outcome.seat, name: parsed.data.name, bound: claim.bound },
      { status: 200, headers: NO_STORE },
    );
    /*
     * The seat's token goes into this browser's cookie for this match, exactly as
     * a scanned seat link or a posted seat would put it there. That is what makes
     * the board hers to play on this device — and it is also what the way BACK
     * undoes: see DELETE below.
     *
     * httpOnly, so the words she tapped never become a value a script on the page
     * can read, and so the token cannot be lifted out of the document either.
     */
    response.cookies.set({
      name: seatCookieName(id),
      value: outcome.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SEAT_COOKIE_DAYS * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    /*
     * The error and never the body: a body on this route holds somebody's
     * password. `console.error(error)` prints what was thrown and nothing of
     * what was sent.
     */
    console.error(error);
    return serverError("Could not take that seat.");
  }
}

/**
 * Hands the board back to whoever is signed in on this device.
 *
 * THE WAY BACK, and it is not an afterthought. A tablet is passed between two
 * people all evening: a feature that can be entered and not left is one nobody
 * uses twice, and "I can't get out of it" is a whole class of fault that only
 * the return trip finds. Clearing the seat cookie is the whole of it — with no
 * cookie, `resolveSeat` falls through to the account signed in on the device and
 * finds whichever seat is theirs.
 *
 * It takes no credential and needs none. Giving up a seat ON THIS BROWSER is not
 * a claim to anything: the seat stays bound to her member id, the game is
 * untouched, and she can tap her words again to pick it back up. Nothing is lost
 * by letting anybody holding the tablet do it, and a password prompt to hand a
 * tablet back would be absurd.
 */
export async function DELETE(request: Request, ctx: RouteContext<"/api/games/[id]/sit-as">) {
  try {
    const tooMany = overLimit(request, "phrase-hand-back");
    if (tooMany !== null) return tooMany;

    const { id } = await ctx.params;
    const response = NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
    response.cookies.set({
      name: seatCookieName(id),
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error(error);
    return serverError("Could not hand the board back.");
  }
}

/** What to say about a seat that could not be taken, once the words were right. */
function refusal(reason: string, said?: string): NextResponse {
  if (reason === "no-game") return notFound("No such game.");
  if (reason === "over-limit") {
    return unprocessable(said ?? "You have as many games on the go as this site allows at once.");
  }
  if (reason === "already-seated") {
    return NextResponse.json(
      { error: "You already have a seat at this board.", reason },
      { status: 409, headers: NO_STORE },
    );
  }
  if (reason === "which-seat") {
    return unprocessable("Both seats are free — say which one you are taking.");
  }
  if (reason === "no-name") return badRequest("A seat needs a name on it.");
  return NextResponse.json(
    { error: "That seat has been taken.", reason },
    { status: 409, headers: NO_STORE },
  );
}
