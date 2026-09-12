import "server-only";

import type { Prisma } from "@prisma/client";

import { foldEmail, memberRowFor } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

import { DEFAULT_PREFERENCES } from "./preferences.constants";
import { mergePreferences, preferencesFrom, sameStored } from "./preferences";
import type { PreferencePatch, Preferences } from "./preferences.types";

/**
 * Where the registry keeps its answers: one JSON column on the member, and
 * NO QUERY OF ITS OWN.
 *
 * One column rather than a row per preference, because appearance is read on
 * nearly every page and a member/key/value table would put a join on each of
 * them for a store whose whole contents fit in a sentence. And the column is
 * read by riding `memberRowFor` — the read every server-rendered page already
 * makes to say who is here, kept for the rest of the request — so a page that
 * asks for a preference pays nothing it was not paying. John's rule, now a
 * rule rather than a preference: nothing here adds a query to a page that did
 * not have one.
 *
 * Nothing outside this file knows which it is; the registry is the design,
 * and this is the detail.
 */

/**
 * Every preference this member holds, at its fallback where they never chose.
 *
 * Always answers, the way `gameDefaultsFor` does and `appearanceFor` does not:
 * a page has to be narrowed somehow, and "the ordinary way" is a perfectly
 * good answer for somebody who never said otherwise. Nobody signed in — a
 * browser holding only an invite — gets the same ordinary answer.
 */
export async function preferencesFor(email: string | null): Promise<Preferences> {
  if (email === null) return { ...DEFAULT_PREFERENCES };
  const row = await memberRowFor(foldEmail(email));
  return preferencesFrom(row?.preferences);
}

/**
 * The column exactly as this member holds it, for a reader that has to tell
 * a choice from a silence.
 *
 * `preferencesFor` above always answers, filling in each fallback, which is
 * right for a page that has to be narrowed somehow and wrong for anything
 * whose fallback would be a lie about the member. The language is the case
 * that forced this: English is what a page is rendered in when nothing has
 * said otherwise, so a filled-in "en" would be indistinguishable from a
 * member who chose English, and would silently overrule the Japanese their
 * browser was asking for. The column is the only place that difference
 * survives — the same reason `keptPreferences` in the browser suite reads it
 * raw rather than through the registry.
 *
 * Raw, and safe to be raw: every reader still puts it through
 * `cleanPreferences`, which is idempotent, so passing this on unchecked is
 * not a way round the registry.
 *
 * NO QUERY OF ITS OWN, exactly as above: it rides `memberRowFor`.
 */
export async function storedPreferencesFor(email: string | null): Promise<unknown> {
  if (email === null) return null;
  const row = await memberRowFor(foldEmail(email));
  return row?.preferences ?? null;
}

/**
 * Lays a change over what the row holds and writes it back: one update by
 * primary key, or none when nothing would change.
 *
 * The row's current value comes from whoever already has it — a page from the
 * read it makes anyway, the API from the profile it has just fetched — so
 * remembering never reads on its own account. Read, merge, write rather than a
 * replacement, because the column holds every preference at once and a page
 * that knows about one of them must not erase the others by writing only its
 * own. Two devices changing different preferences in the same instant could
 * lose one: a choice somebody can make again, which is not worth a lock.
 */
export async function writePreferences(email: string, stored: unknown, patch: PreferencePatch): Promise<void> {
  const merged = mergePreferences(stored, patch);
  // Re-following a link already chosen says nothing new, and costs nothing.
  if (sameStored(stored, merged)) return;
  await prisma.member.update({
    where: { email: foldEmail(email) },
    // What came out of the column goes back into it, with the change laid over.
    data: { preferences: merged as Prisma.InputJsonObject },
  });
}

/**
 * Keeps a change on the member's account, from a page that has read their
 * row this request already.
 *
 * Nobody to keep it for — an address with no member row, which the operator
 * can be on a development database — and nothing is written. The page still
 * obeys what was asked; it only cannot remember it.
 */
export async function rememberPreferences(email: string, patch: PreferencePatch): Promise<void> {
  const row = await memberRowFor(foldEmail(email));
  if (row === null) return;
  await writePreferences(email, row.preferences, patch);
}
