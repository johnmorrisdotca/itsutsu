import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySession, type Session } from "./session";

/** The session this request carries, or null. Nothing here checks the allowlist; see requireAdmin. */
export async function currentSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** The signed-in address, folded, or null for a browser that only holds an invite. */
export async function currentEmail(): Promise<string | null> {
  const session = await currentSession();
  return session?.email ? session.email.trim().toLowerCase() : null;
}
