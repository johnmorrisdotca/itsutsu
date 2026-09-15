import "server-only";

import { currentSession } from "./currentSession";
import { memberRowFor } from "./members";
import { readerFrom } from "./reader";
import type { Reader } from "./reader.types";

/**
 * Who is reading this page — THE ONE PLACE A PAGE ASKS "IS SOMEBODY SIGNED IN".
 *
 * Five pages asked `currentEmail() !== null` and got the answer for a different
 * question: "did this person come in by Google". Everybody who joined with an
 * invite code has a session and no address, so the lobby sentence, the set-up
 * screen and the board all treated them as a stranger while the masthead
 * offered to sign them out. `signed-in.coverage.test.ts` holds every page to
 * this function, so the next page cannot ask the address instead.
 *
 * No extra read. `currentSession()` has already fetched the member row through
 * `touchMember`, and `memberRowFor` is cached per request, so the id comes off
 * the row already in hand — and an invite holder, with no address, costs no
 * member lookup at all.
 */
export async function currentReader(): Promise<Reader> {
  const session = await currentSession();
  const email = session?.email ? session.email.trim().toLowerCase() : null;
  const row = email === null ? null : await memberRowFor(email);
  return readerFrom(session, row?.id ?? null);
}
