import "server-only";

import { cache } from "react";

import { rememberPreferences, storedPreferencesFor } from "@/lib/preferences/memberPreferences";

import type { Locale } from "./i18n.types";
import { languageAsPreferences, languageFrom } from "./languagePreference";

/**
 * The language on a member's account, and the one place a choice is kept.
 *
 * John: "I think language is another cross device thing." So it is kept where
 * the players filter is kept — the preferences registry, one JSON column on
 * the member — and read back on every device that signs in.
 *
 * NO QUERY OF ITS OWN, AND NO NEW ONE ON ANY PAGE. Both halves ride
 * `memberRowFor`, the single row every server-rendered page already reads to
 * say who is here, `cache()`d for the rest of the request. `layout.tsx` asks
 * for the language before it renders the masthead, so this is now usually the
 * call that populates that cache rather than one that adds to it: the same
 * one read, in a different order. A reader who is not signed in costs
 * nothing at all — there is no address to look up.
 *
 * AND NOTHING IS READ IN THE GATE. `proxy.ts` runs on every request to the
 * site and must never reach the database — that is a cost rule and a
 * correctness rule both, and it is why the language cannot simply be looked
 * up per request on the way in. The gate's whole part in this is to set a
 * cookie saying a choice was just made; everything that knows about members
 * happens here, while a page is being rendered, which is only ever when a
 * page was actually asked for. `memberFilter.ts` gives the second half of
 * that reasoning: the gate answers a prefetch like any other request, so a
 * preference kept there would be one nobody chose.
 */

/**
 * What this member's account says, or null when nobody is signed in, the
 * account has never chosen, or the database would not answer.
 *
 * A FAILURE IS SILENCE, NOT ENGLISH. `<html lang>` comes off the back of this
 * on every page, and the site already treats the member row as something a
 * page can do without — `currentSession` catches `touchMember` for exactly
 * this reason. A rule that cannot measure must not fire: an unreachable
 * database means the account has nothing to say this request, so the cookie
 * and then the browser's own header answer, which is what they did before any
 * of this existed.
 */
export async function languageOnAccount(email: string | null): Promise<Locale | null> {
  if (email === null) return null;
  try {
    return languageFrom(await storedPreferencesFor(email));
  } catch (error) {
    console.error("Could not read the language on the account.", error);
    return null;
  }
}

/**
 * Keeps a language a signed-in member has just chosen.
 *
 * ONCE PER REQUEST, and that is what `cache()` is doing here rather than an
 * optimisation. `currentLocale` is asked for the language five times on an
 * ordinary page — the document element, the colophon, the page itself — and
 * the row `memberRowFor` hands back is the row as it was when this request
 * started. So the second caller would compare the new choice against the
 * stale column, find them different, and write again; five callers, five
 * updates. `touchMember` is `cache()`d against the identical hazard, and says
 * so: "three callers handed the same stale stamp would otherwise each have
 * written it."
 *
 * Nothing to keep — nobody signed in, or no choice just made — and nothing
 * happens, which is nearly every request. A member whose account already
 * says this writes nothing either: `writePreferences` compares before it
 * updates.
 *
 * A write that fails is logged and dropped, as the players filter's is. What
 * the reader asked for is already being honoured by the cookie; all that is
 * lost is the remembering, and the next click will try again.
 */
export const keepChosenLanguage = cache(
  async (email: string | null, chosen: Locale | null): Promise<void> => {
    if (email === null || chosen === null) return;
    await rememberPreferences(email, languageAsPreferences(chosen)).catch((error: unknown) => {
      console.error("Could not remember the language chosen.", error);
    });
  },
);
