import "server-only";

import { currentMemberId } from "@/lib/auth/currentSession";
import { preferencesFor, rememberPreferences } from "@/lib/preferences/memberPreferences";
import type { RecordScope } from "@/lib/rating/recordScope";

import { askedXpScope } from "./xpScope";

/**
 * How much the XP board and its rungs count, for this request: what the address
 * says, else what this member chose last time, else Everywhere.
 *
 * `xpWhoFor`'s shape on the board's own key (`xpScope`): the address is how a
 * choice is MADE and the account is where it is KEPT, so a chip followed is
 * remembered and a bare address opens on the last choice. A signed-out reader
 * has only the address. Nothing here redirects.
 */
export async function xpScopeFor(query: Record<string, string | string[] | undefined>): Promise<RecordScope> {
  const memberId = await currentMemberId();
  const preferences = await preferencesFor();
  const asked = askedXpScope(query);
  if (asked === null) return preferences.xpScope;
  if (memberId !== null) {
    await rememberPreferences({ xpScope: asked }).catch((error: unknown) => {
      console.error("Could not remember how much the XP board counts.", error);
    });
  }
  return asked;
}
