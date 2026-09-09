import "server-only";

import { cookies } from "next/headers";

import { isAdminEmail } from "./admin";
import { isBanned } from "./members";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

/**
 * The operator session, or null.
 *
 * The gate in `proxy.ts` only proves somebody got in with *a* valid session.
 * Operator-only work re-checks here, against the allowlist as well as the
 * signature, so an ordinary player's cookie can never reach it — and so
 * removing an email from ADMIN_EMAILS takes effect on the next request rather
 * than whenever their cookie happens to expire.
 *
 * A shut account is not the operator either. `currentSession` has always read
 * the member row and refused a banned one, which is what makes shutting an
 * ordinary member work; this did not, so an operator's ban was written and
 * then never read — the row went red, the badge appeared, and nothing
 * whatsoever happened. The control said one thing and the site did another,
 * which is worse than not offering it.
 */
export async function currentAdmin(): Promise<Session | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);

  if (session === null || session.kind !== "admin") return null;
  if (!isAdminEmail(session.email)) return null;
  // Fail open on a database that is down rather than locking the operator out
  // of their own site over a transient fault: the allowlist has already been
  // checked, so this narrows an operator, it does not admit anybody.
  if (session.email && (await isBanned(session.email).catch(() => false))) return null;
  return session;
}

/**
 * Whether this address is the operator's own, for a page deciding what to
 * offer them about themselves.
 */
export async function isMe(email: string | null): Promise<boolean> {
  if (email === null) return false;
  const me = await currentAdmin();
  return me?.email?.trim().toLowerCase() === email.trim().toLowerCase();
}

export async function isAdminRequest(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}
