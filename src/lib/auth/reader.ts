import type { Reader } from "./reader.types";
import type { Session } from "./session";

/** Nobody: no session, so nothing else to know. */
export const SIGNED_OUT: Reader = { signedIn: false, email: null, memberId: null, hasAccount: false };

/**
 * The reader, from the session a request carries and the member row its
 * address found.
 *
 * Pure, so the one rule every page now asks is tested without a cookie jar:
 * the SESSION says whether somebody is in, the ADDRESS says which reads can be
 * kept for them, and the MEMBER ID says who they are. `currentReader` is the
 * server half that fetches the two inputs.
 */
export function readerFrom(session: Session | null, memberId: string | null): Reader {
  if (session === null) return SIGNED_OUT;
  const email = session.email ? session.email.trim().toLowerCase() : null;
  /*
   * A member id with no address is not a thing a session can carry — an id is
   * found BY the address — so one arriving without one is ignored rather than
   * believed. Silence is the safe answer here: an invite holder mistaken for a
   * member would be offered buttons every route behind them refuses.
   */
  const member = email === null ? null : memberId;
  return { signedIn: true, email, memberId: member, hasAccount: email !== null && member !== null };
}
