import "server-only";

import { currentMemberId } from "@/lib/auth/currentSession";
import { preferencesFor, rememberPreferences } from "@/lib/preferences/memberPreferences";
import type { DirectoryWho } from "@/lib/rating/directoryFilter";

import { askedXpWho } from "./xpWho";

/**
 * Who the XP board and its rungs are about, for this request: what the
 * address says, else what this member chose last time, else everyone.
 *
 * The same shape as `directoryFilterFor` in `memberFilter.ts`, on the board's
 * own key: the address is how a choice is MADE and the account is where it is
 * KEPT, so a chip followed is remembered and a bare address opens on the last
 * choice. A signed-out reader has only the address. Nothing here redirects.
 */
export async function xpWhoFor(query: Record<string, string | string[] | undefined>): Promise<DirectoryWho> {
  const memberId = await currentMemberId();
  const preferences = await preferencesFor();
  const asked = askedXpWho(query);
  if (asked === null) return preferences.xpWho;
  if (memberId !== null) {
    await rememberPreferences({ xpWho: asked }).catch((error: unknown) => {
      console.error("Could not remember who the XP board is about.", error);
    });
  }
  return asked;
}
