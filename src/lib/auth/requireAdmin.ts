import "server-only";

import { cookies } from "next/headers";

import { isAdminEmail } from "./admin";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

/**
 * The operator session, or null.
 *
 * The gate in `proxy.ts` only proves somebody got in with *a* valid session.
 * Operator-only work re-checks here, against the allowlist as well as the
 * signature, so an ordinary player's cookie can never reach it — and so
 * removing an email from ADMIN_EMAILS takes effect on the next request rather
 * than whenever their cookie happens to expire.
 */
export async function currentAdmin(): Promise<Session | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);

  if (session === null || session.kind !== "admin") return null;
  if (!isAdminEmail(session.email)) return null;
  return session;
}

export async function isAdminRequest(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}
