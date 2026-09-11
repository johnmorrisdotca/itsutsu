import "server-only";

import { currentEmail } from "@/lib/auth/currentSession";
import { preferencesFor, rememberPreferences } from "@/lib/preferences/memberPreferences";

import type { DirectoryFilter } from "./directoryFilter";
import { addressSaysFilter, filterAsPreferences, filterFor } from "./rememberedFilter";

/**
 * The filter the players page shows this reader, and the one place it is
 * remembered.
 *
 * What the address asks for wins and is kept; a silent address gets what this
 * reader last asked for, or the ordinary page if they never have. An address
 * that asks is a choice made — clicked, typed, or followed from somebody's
 * message — which is what the cookie took it for, and what the tests that
 * drive this by address rely on.
 *
 * REMEMBERED WHILE THE PAGE RENDERS, NOT IN THE PROXY. The gate file cannot
 * reach the database without carrying Prisma on every request to the site.
 * And it answers a prefetch like any other request, so a cookie set there
 * remembered whichever of the bar's links had last come into view — a
 * narrowing nobody chose. A page body is only rendered when the page is
 * actually asked for, so a choice kept here is one somebody made. The same
 * page already touches the member row on every render to say who is here;
 * this is one more small write on the visits that ask for something, and
 * nothing on the visits that do not.
 *
 * A preference that cannot be kept — a database that would not take the
 * write — is logged and does not break the page: what was asked for is still
 * shown, it is only not remembered. An address with no member row, which the
 * operator can be on a development database, is the same answer without the
 * log; see `rememberPreferences`.
 */
export async function directoryFilterFor(
  query: Record<string, string | string[] | undefined>,
): Promise<DirectoryFilter> {
  const email = await currentEmail();
  const filter = filterFor(query, await preferencesFor(email));
  if (email !== null && addressSaysFilter(query)) {
    await rememberPreferences(email, filterAsPreferences(filter)).catch((error: unknown) => {
      console.error("Could not remember the players filter.", error);
    });
  }
  return filter;
}
