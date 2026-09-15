import "server-only";

import { cookies } from "next/headers";

import { memberKeyOf } from "./memberKey";
import { memberRowFor, touchMember } from "./memberRow";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

/**
 * The session this request carries, or null. Nothing here checks the
 * allowlist; see requireAdmin.
 *
 * Every page calls this to know who is looking at it, so it is also where
 * "who is here" gets its answer: touchMember is cheap (a throttled write, at
 * most once a minute) and every server-rendered page already pays for the
 * cookie read this sits beside.
 *
 * BY THE MEMBER THE SESSION NAMES — its id, or the address on an older Google
 * cookie; see `memberKeyOf`. It was the address alone, so a member who came in
 * with an invite code was never seen and could never be shut out.
 */
export async function currentSession(): Promise<Session | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  const key = memberKeyOf(session);
  if (key !== null) {
    // A signed cookie says who they are; whether they are still welcome is a
    // fact about the account, and it is read here on every request.
    const seen = await touchMember(key.by, key.value).catch(() => ({ banned: false }));
    if (seen.banned) return null;
  }
  return session;
}

/**
 * The signed-in address, folded, or null for a member with no address — one
 * who came in with an invite code — and for nobody.
 *
 * For the questions only an address answers: whether the operator is who is
 * asking, and whether Google has already let this address in. Never for who
 * somebody is; that is `currentMemberId`.
 */
export async function currentEmail(): Promise<string | null> {
  const session = await currentSession();
  return session?.email ? session.email.trim().toLowerCase() : null;
}

/**
 * The signed-in member's row, as `memberRowFor` reads it, or null.
 *
 * ALWAYS BY THE KEY THE SESSION CARRIES, so every part of a page that asks —
 * the badge, the language, the preferences, the zone — shares the one read
 * `currentSession` has already made, and a request never reads the row twice
 * under two names.
 */
export async function currentMemberRow() {
  const key = memberKeyOf(await currentSession());
  if (key === null) return null;
  return memberRowFor(key.by, key.value);
}

/**
 * The signed-in member's opaque id, or null when nobody is signed in.
 *
 * What a seat, a rating and a record are all anchored to — and, now, a buddy
 * list, an ignore list and a mark. Nothing outside this file and the member
 * table should be comparing addresses to decide who somebody is.
 *
 * OFF THE ROW THAT HAS ALREADY BEEN READ, rather than a `findUnique` of its
 * own. `memberRowFor` is `cache()`d per request and `currentSession()` above
 * has just run it through `touchMember`, so by the time anybody asks who is
 * signed in, the row — and the id on it — is in hand.
 *
 * This is what `XP_DESIGN.md` means by "adding `id` has a bonus": every route
 * that asks for the member id to write something now asks for free, which is
 * what lets an award ride a route's existing work instead of adding a query to
 * it. Outside a render the cache is per call, so this is one read either way
 * and never more than one.
 */
export async function currentMemberId(): Promise<string | null> {
  const row = await currentMemberRow();
  return row?.id ?? null;
}
