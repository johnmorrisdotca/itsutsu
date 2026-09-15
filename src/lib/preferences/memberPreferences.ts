import "server-only";

import { foldEmail, memberRowFor } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

import { DEFAULT_PREFERENCES } from "./preferences.constants";
import { mergePreferences, patchParts, preferencesFrom, sameStored } from "./preferences";
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
 * Lays a change over what the row holds: one statement, or none when nothing
 * would change.
 *
 * The row's current value comes from whoever already has it — a page from the
 * read it makes anyway, the API from the profile it has just fetched — so
 * remembering never reads on its own account. A merge rather than a
 * replacement, because the column holds every preference at once and a page
 * that knows about one of them must not erase the others by writing only its
 * own.
 *
 * THE MERGE HAPPENS IN THE DATABASE, INSIDE THE UPDATE. It used to happen
 * here, over the row as this request first read it, and the whole object went
 * back — so two overlapping writes of DIFFERENT preferences kept only the one
 * that landed last. That was written off as two devices in the same instant,
 * which nobody would meet. The browser suite met it twice, as flakes:
 *
 *  - The XP board and its rungs remember who and how much in one render, both
 *    at once (`xpWhoFor` and `xpScopeFor` under one `Promise.all`), from one
 *    cached row. Whichever wrote second put the other back, so a chip followed
 *    on a rung could be forgotten by the board a click later.
 *  - A device reporting its time zone through `/api/me` fires as a page
 *    hydrates, which is the second somebody clicks a language. The zone's
 *    write carried the row from before the click and took the language back
 *    off the account, and the member's next device spoke the old one.
 *
 * Laid over the column inside the statement, each write sets and removes only
 * the keys its patch names (`patchParts`), so neither can undo the other. Two
 * writes of the SAME preference still end on the later one, which is the right
 * answer for one choice made twice. A key this version does not know is left
 * where it was, as before. And `stored` still decides whether there is
 * anything to say: the same link followed twice costs no write.
 */
export async function writePreferences(email: string, stored: unknown, patch: PreferencePatch): Promise<void> {
  // Re-following a link already chosen says nothing new, and costs nothing.
  if (sameStored(stored, mergePreferences(stored, patch))) return;
  const { set, forget } = patchParts(patch);
  const written = await prisma.$executeRaw`
    UPDATE "Member"
    SET "preferences" = (
      CASE WHEN jsonb_typeof("preferences") = 'object' THEN "preferences" ELSE '{}'::jsonb END
      || ${JSON.stringify(set)}::jsonb
    ) - ${forget}::text[]
    WHERE "email" = ${foldEmail(email)}`;
  // What `member.update` did for a row that is not there: say so, rather than succeed at nothing.
  if (written === 0) throw new Error("There is no member row to keep these preferences on.");
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
