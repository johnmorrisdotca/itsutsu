import "server-only";

import { currentMemberId } from "@/lib/auth/currentSession";
import { preferencesFor, rememberPreferences } from "@/lib/preferences/memberPreferences";

import {
  addressSaysWho,
  filterAsPreferences,
  filterFor,
  whoFromMemory,
  type ShownDirectoryFilter,
} from "./rememberedFilter";

/**
 * The filter the players page shows this reader, and the one place its kind
 * of player is remembered.
 *
 * What the address asks for wins; a silent address gets the kind of player this
 * reader last chose, with both switches off — see `rememberedFilter.ts` for
 * why the switches are never kept. An address that names who is a choice made —
 * clicked, typed, or followed from somebody's message — and is kept.
 *
 * NO QUERY OF ITS OWN. The read rides the one every server-rendered page
 * already makes to say who is here — the signed-in member's row, kept for the
 * rest of the request — so a bare visit costs the page nothing it was not
 * paying. A visit that names who writes once, by primary key, and only when the
 * answer differs from what is kept: re-following a link already chosen writes
 * nothing.
 *
 * REMEMBERED WHILE THE PAGE RENDERS, NOT IN THE PROXY. The gate file cannot
 * reach the database without carrying Prisma on every request to the site.
 * And it answers a prefetch like any other request, so a cookie set there
 * remembered whichever of the bar's links had last come into view — a
 * narrowing nobody chose. A page body is only rendered when the page is
 * actually asked for (a dynamic page with no loading boundary is prefetched as
 * its route tree alone), so a choice kept here is one somebody made.
 *
 * A preference that cannot be kept — a database that would not take the
 * write — is logged and does not break the page: what was asked for is still
 * shown, it is only not remembered. A session with no member row, which the
 * operator can be on a development database, is the same answer without the
 * log; see `rememberPreferences`.
 */
export async function directoryFilterFor(
  query: Record<string, string | string[] | undefined>,
): Promise<ShownDirectoryFilter> {
  const memberId = await currentMemberId();
  const preferences = await preferencesFor();
  const filter = filterFor(query, preferences);
  if (memberId !== null && addressSaysWho(query)) {
    await rememberPreferences(filterAsPreferences(filter)).catch((error: unknown) => {
      console.error("Could not remember the players filter.", error);
    });
  }
  return { filter, rememberedWho: whoFromMemory(query, preferences) };
}
