import "server-only";

import type { Prisma } from "@prisma/client";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

import { DEFAULT_PREFERENCES } from "./preferences.constants";
import { mergePreferences, preferencesFrom } from "./preferences";
import type { PreferencePatch, Preferences } from "./preferences.types";

/**
 * Where the registry keeps its answers: one JSON column on the member.
 *
 * One column rather than a row per preference. Appearance is read on nearly
 * every page, and a member/key/value table would put a join on each of them
 * for a store whose whole contents fit in a sentence. Nothing outside this
 * file knows which it is; the registry is the design, and this is the detail.
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
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { preferences: true },
  });
  return preferencesFrom(row?.preferences);
}

/**
 * Keeps a change on the member's account, laid over what is already there.
 *
 * Read, merge, write, rather than a replacement: the column holds every
 * preference at once, and a page that knows about one of them must not erase
 * the others by writing only its own. Two devices changing different
 * preferences in the same instant could lose one — a choice somebody can
 * make again, which is not worth a lock.
 *
 * Nobody to keep it for — an address with no member row, which the operator
 * can be on a development database — and nothing is written. The page still
 * obeys what was asked; it only cannot remember it.
 */
export async function rememberPreferences(email: string, patch: PreferencePatch): Promise<void> {
  const key = foldEmail(email);
  const row = await prisma.member.findUnique({ where: { email: key }, select: { preferences: true } });
  if (row === null) return;
  await prisma.member.update({
    where: { email: key },
    // What came out of the column goes back into it, with the change laid over.
    data: { preferences: mergePreferences(row.preferences, patch) as Prisma.InputJsonObject },
  });
}
