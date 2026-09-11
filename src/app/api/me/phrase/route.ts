import { NextResponse } from "next/server";
import { z } from "zod";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { overLimit } from "@/lib/api/rateLimit";
import { currentMemberId } from "@/lib/auth/currentSession";
import { CREDENTIALS, removalRefusal } from "@/lib/phrase/credentials";
import { completedPhrase, readTicket } from "@/lib/phrase/pickTicket";
import { clearPhrase, phraseStatus, setPhrase } from "@/lib/phrase/phraseStore";

/**
 * A member's four-word phrase: whether there is one, setting one, removing one.
 *
 * NOTHING HERE EVER RETURNS THE WORDS OR THE HASH. `GET` answers three facts —
 * there is a phrase, it was set on this date, and it could or could not be
 * removed — because those are the only three that can be known. A properly
 * hashed phrase cannot be shown again, which is correct and is the reason the
 * setup screen has to do real work and rerolling has to be easy.
 *
 * SETTING ONE IS A `PUT`. It is idempotent in the way that matters: a member has
 * at most one phrase, and setting a second replaces the first rather than adding
 * to a collection. Rerolling is the same call, deliberately — forgetting should
 * be a thirty-second re-pick rather than a crisis.
 */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "phrase");
    if (tooMany !== null) return tooMany;

    const me = await currentMemberId();
    if (me === null) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    }

    const status = await phraseStatus(me);
    if (status === null) return notFound("No account to read.");

    return NextResponse.json(
      {
        set: status.set,
        // A date and not a hash. The one thing about a phrase that can be shown.
        setAt: status.setAt?.toISOString() ?? null,
        hasEmail: status.hasEmail,
        mayRemove: status.mayRemovePhrase,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not read that.");
  }
}

const setSchema = z.object({
  /** The finished pick, signed by us. The words are read out of it, never off the body. */
  ticket: z.string().min(1).max(4096),
  /**
   * That the member has written the words down.
   *
   * Asked for, not assumed, and refused without it. A hashed phrase cannot be
   * shown again — so the moment it is set is the only moment it exists in a form
   * anybody can read, and setting one without that being acknowledged is how a
   * twelve-year-old ends up locked out of her own games. The box is the cheapest
   * part of this feature and the one that stops the worst outcome.
   */
  acknowledged: z.literal(true),
});

export async function PUT(request: Request) {
  try {
    const tooMany = overLimit(request, "phrase");
    if (tooMany !== null) return tooMany;

    const me = await currentMemberId();
    if (me === null) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    }

    const body = await readJson(request);
    if (body === undefined) return badRequest("Expected a JSON body.");
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) {
      /*
       * The unticked box gets its own wording. Every other fault here is a
       * client sending nonsense, but this one is a person who has not said they
       * wrote the words down — the one refusal on this route that a reader is
       * meant to see and act on.
       */
      const unacknowledged = parsed.error.issues.some((issue) => issue.path[0] === "acknowledged");
      return badRequest(
        unacknowledged
          ? "Write the four words down somewhere first, then tick the box."
          : (parsed.error.issues[0]?.message ?? "That is not a finished phrase."),
      );
    }

    /*
     * THE WORDS COME OUT OF THE SIGNED TICKET AND NEVER OFF THE REQUEST BODY.
     * That is the whole of why the picker is as strong as random: a browser that
     * could post four words of its own choosing would make the phrase only as
     * good as a person's taste in words, and the ticket is what lets the server
     * say it offered every one of them.
     */
    const state = await readTicket(parsed.data.ticket, me);
    if (state === null) {
      return NextResponse.json(
        { error: "That pick has expired. Choose four words again — it takes half a minute." },
        { status: 409, headers: NO_STORE },
      );
    }
    const words = completedPhrase(state);
    if (words === null) return unprocessable("That phrase is not finished: four words are needed.");

    const outcome = await setPhrase(me, words);
    if (!outcome.ok) {
      return outcome.reason === "no-member"
        ? notFound("No account to set a phrase on.")
        : unprocessable("Those are not four words from the list.");
    }
    /*
     * `ok` and nothing else. Not the words, not the hash, not an echo of the
     * ticket — the browser already has the words on screen, and everything this
     * could add would be a credential in a response body for no reason.
     */
    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not set those words.");
  }
}

/**
 * Takes the phrase away.
 *
 * Refused when it is the account's only way in — you may add either credential
 * and you may not remove your last. The rule is `credentials.ts`'s and is asked
 * inside the store, so a second caller cannot get it wrong.
 */
export async function DELETE(request: Request) {
  try {
    const tooMany = overLimit(request, "phrase");
    if (tooMany !== null) return tooMany;

    const me = await currentMemberId();
    if (me === null) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401, headers: NO_STORE });
    }

    const outcome = await clearPhrase(me);
    if (!outcome.ok) {
      return outcome.reason === "no-member"
        ? notFound("No account to change.")
        : unprocessable(removalRefusal(CREDENTIALS.phrase));
    }
    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error(error);
    return serverError("Could not remove those words.");
  }
}
