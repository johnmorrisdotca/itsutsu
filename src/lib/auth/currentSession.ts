import "server-only";

import { cookies } from "next/headers";

import { touchMember } from "./members";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

/**
 * The session this request carries, or null. Nothing here checks the
 * allowlist; see requireAdmin.
 *
 * Every page calls this to know who is looking at it, so it is also where
 * "who is here" gets its answer: touchMember is cheap (a throttled write, at
 * most once a minute) and every server-rendered page already pays for the
 * cookie read this sits beside.
 */
export async function currentSession(): Promise<Session | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (session?.email) await touchMember(session.email).catch(() => undefined);
  return session;
}

/** The signed-in address, folded, or null for a browser that only holds an invite. */
export async function currentEmail(): Promise<string | null> {
  const session = await currentSession();
  return session?.email ? session.email.trim().toLowerCase() : null;
}
