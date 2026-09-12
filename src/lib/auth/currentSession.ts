import "server-only";

import { cookies } from "next/headers";

import { memberRowFor, touchMember } from "./members";
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
  if (session?.email) {
    // A signed cookie says who they are; whether they are still welcome is a
    // fact about the account, and it is read here on every request.
    const seen = await touchMember(session.email).catch(() => ({ banned: false }));
    if (seen.banned) return null;
  }
  return session;
}

/** The signed-in address, folded, or null for a browser that only holds an invite. */
export async function currentEmail(): Promise<string | null> {
  const session = await currentSession();
  return session?.email ? session.email.trim().toLowerCase() : null;
}

/**
 * The signed-in member's opaque id, or null when nobody is signed in.
 *
 * What a seat, a rating and a record are all anchored to. The address still
 * identifies the row while it remains the key, but nothing outside this file
 * and the member table should be comparing addresses to decide who somebody
 * is.
 */
export async function currentMemberId(): Promise<string | null> {
  const email = await currentEmail();
  if (email === null) return null;
  /*
   * OFF THE ROW THAT HAS ALREADY BEEN READ, rather than a `findUnique` of its
   * own. `memberRowFor` is `cache()`d per request and `currentSession()` above
   * has just run it through `touchMember`, so by the time anybody asks who is
   * signed in, the row — and the id on it — is in hand. It is keyed by the
   * folded address, which is what `currentEmail` returns.
   *
   * This is what `XP_DESIGN.md` means by "adding `id` has a bonus": every route
   * that asks for the member id to write something now asks for free, which is
   * what lets an award ride a route's existing work instead of adding a query to
   * it. Outside a render the cache is per call, so this is one read either way
   * and never more than one.
   */
  const row = await memberRowFor(email);
  return row?.id ?? null;
}
