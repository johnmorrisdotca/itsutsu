import type { MemberKey } from "./memberKey.types";
import type { Session } from "./session";

/**
 * The one key a session's member is read by.
 *
 * THE ID FIRST. Every session minted from here on carries the member's id —
 * a member who came in with an invite code has no address at all, so the id is
 * the only thing that can name them. A Google session from an earlier release
 * carries only the address, and is read by it until it expires.
 *
 * Nothing for a session that names no member: an operator signed in by token,
 * with no row, and an invite-only cookie from before redeeming made a member
 * (which `/api/session` turns into one the next time the browser asks).
 *
 * Pure, and asked once per request by `currentSession`: every reader of the
 * member row uses the key this returns, so a page reads the row once however
 * many parts of it ask who is here.
 */
export function memberKeyOf(session: Session | null): MemberKey | null {
  if (session === null) return null;
  if (session.memberId) return { by: "id", value: session.memberId };
  if (session.email) return { by: "email", value: session.email.trim().toLowerCase() };
  return null;
}
