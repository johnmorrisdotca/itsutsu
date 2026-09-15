import type { Reader } from "./reader.types";
import type { Session } from "./session";

/** Nobody: no session, so nothing else to know. */
export const SIGNED_OUT: Reader = { signedIn: false, email: null, memberId: null, hasAccount: false };

/**
 * The reader, from the session a request carries and the member row it names.
 *
 * Pure, so the one rule every page asks is tested without a cookie jar: the
 * SESSION says whether somebody is in, the MEMBER ID says who they are and that
 * they have an account, and the ADDRESS says only which of the few
 * address-shaped questions — is this the operator — can be asked.
 *
 * AN ACCOUNT IS A MEMBER ROW, whether or not an address comes with it. It used
 * to need both, because redeeming an invite code made a session and no member;
 * since a code makes a member, somebody who came in by code has an account like
 * anybody else, and asks, buddies, ignores and applauds as one.
 */
export function readerFrom(session: Session | null, memberId: string | null): Reader {
  if (session === null) return SIGNED_OUT;
  const email = session.email ? session.email.trim().toLowerCase() : null;
  return { signedIn: true, email, memberId, hasAccount: memberId !== null };
}
