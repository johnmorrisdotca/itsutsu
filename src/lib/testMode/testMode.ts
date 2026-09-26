import "server-only";

import type { Prisma } from "@prisma/client";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { isAdminRequest } from "@/lib/auth/requireAdmin";
import { preferencesFor } from "@/lib/preferences/memberPreferences";

/**
 * TEST MODE: THE ONE RULE.
 *
 * John, 2026-09-25: "in Test mode, all the Test Users are available in all my
 * scoreboards, etc. And this can also be seen in production... so we do all
 * the calculations and test runs locally and can push the stats to
 * Production to be viewed in prod if I have my internal Test Mode turned
 * on... in Test mode site runs normally but Admin can see the Test users."
 *
 * Three things follow from that sentence, and they are the whole design:
 *
 * 1. **A test member (`unclaimableBecause: "test"`, the Test kind in
 *    `memberKind.ts`) is invisible by default, everywhere.**
 *    Not banned, not filtered by a page's own judgement call — hidden at the
 *    one place every surface already asks the database, the same way a
 *    banned member or a kept record is handled today.
 * 2. **Only the OPERATOR'S OWN Test Mode switch changes what THE OPERATOR
 *    sees.** It is "my scoreboards", not everybody's: turning it on never
 *    shows a test member to an ordinary member, whatever John is looking at
 *    in another tab.
 * 3. **It works the same in production as it does locally**, because it is a
 *    stored preference on the operator's own row, not an environment flag
 *    that would need a redeploy to flip.
 *
 * TWO FUNCTIONS, ON PURPOSE, NOT ONE. `currentTestModeReader()` is the only
 * one that touches the request: it reads the session and the signed-in
 * member's stored preference, so it can only be called from a Server
 * Component, a route or a Server Function — anywhere `next/headers`'
 * `cookies()` works. `hiddenMembersWhere(reader)` is pure and synchronous: it
 * takes the small value the first function produced and turns it into a
 * Prisma filter, nothing else. That split is what lets `src/lib/rating/*`,
 * `src/lib/xp/*` and the rest stay plain, testable functions that a unit test
 * can call directly with `{ showsTestMembers: false }` — calling `cookies()`
 * three modules deep would throw outside a request, and did, the first time
 * this was tried that way (see `docs/plans/test-mode/README.md`).
 *
 * A PAGE READS THE REQUEST ONCE, near its top: `const reader =
 * await currentTestModeReader()`, then passes `reader` (or the `where`
 * fragment already built from it) down to whatever it calls. EVERY member,
 * game, rating, XP, IP, count and leaderboard query that reads `Member` rows
 * ANDs `hiddenMembersWhere(reader)` into whatever it was already filtering
 * by. `testMode.coverage.test.ts` greps every `prisma.member.*` call site
 * that lists or counts more than one row and fails unless the file also
 * calls this rule, or is named in that test's own exceptions with the reason
 * it is not converted yet.
 */
export type TestModeReader = { showsTestMembers: boolean };

/** Nobody: the answer every ordinary reader gets, and the safe default for a caller with no request to ask. */
export const HIDES_TEST_MEMBERS: TestModeReader = { showsTestMembers: false };

/**
 * Reads the request ONCE: is this the signed-in admin, and has THEY turned
 * their own Test Mode on. Call this near the top of a page, a route or a
 * Server Function — never inside a plain `src/lib` helper, which this file's
 * own comment explains.
 */
export async function currentTestModeReader(): Promise<TestModeReader> {
  if (!(await isAdminRequest())) return HIDES_TEST_MEMBERS;
  const prefs = await preferencesFor();
  return { showsTestMembers: prefs.testMode === true };
}

/** Convenience for a caller that only wants the one boolean — a banner, a badge — and needs nothing else from the reader. */
export async function showsTestMembers(): Promise<boolean> {
  return (await currentTestModeReader()).showsTestMembers;
}

/**
 * The `Member` filter every query reads through: nothing extra when the
 * reader may see test members, every row that is not the Test kind otherwise
 * — written with the null spelled out, because `NOT (col = 'test')` is NULL
 * for an ordinary member and would hide everybody. Pure and
 * synchronous, so it can be called from anywhere — `AND` it into whatever the
 * caller was already filtering by, never as the only condition, the way
 * `botTier` and `unclaimableBecause` filters already are not.
 */
export function hiddenMembersWhere(reader: TestModeReader): Prisma.MemberWhereInput {
  return reader.showsTestMembers
    ? {}
    : { OR: [{ unclaimableBecause: null }, { unclaimableBecause: { not: UNCLAIMABLE_REASONS.test } }] };
}
