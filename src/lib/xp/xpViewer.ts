import "server-only";

import { currentEmail } from "@/lib/auth/currentSession";
import { memberRowFor } from "@/lib/auth/members";

import { xpStanding, type XpStanding } from "./xpCurve";

/**
 * WHERE THE READER STANDS, FOR NO QUERY AT ALL.
 *
 * Both XP pages want the same thing: the ladder marks the rung the reader is on,
 * and the leaderboard marks their row. Neither is worth a query, and neither
 * costs one — `memberRowFor` is `cache()`d per request and already selects `xp`,
 * and it has already run by the time any page body does, because `currentSession`
 * calls `touchMember` and every page draws `SiteHeader`. So this is a second read
 * of a row that is in hand.
 *
 * That is the whole reason it exists as a function rather than as two lines in
 * each page. Written out at the call site, the obvious shape is
 * `prisma.member.findUnique({ where: { email }, select: { xp: true } })` — which
 * is correct, cheap-looking, and a query per page view on two pages for a fact
 * already loaded. This site's owner's standing rule is no extra cost, ever.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NULL MEANS "NOBODY TO MARK", AND IT IS NOT THE SAME AS ZERO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Three readers reach these pages and they are three different states, not two:
 *
 *   - A member, who has a row and a total. Their rung is marked.
 *   - A reader holding an invite but no account. There is nobody to mark, and
 *     what they are offered is `/join`.
 *   - The operator, who has a session and no `Member` row at all — see
 *     AGENTS.md on the fixture that must make the row it signs in as. They are
 *     the second case, and this returns null for them rather than inventing a
 *     standing at level 1.
 *
 * A member with zero XP IS at level 1 and is marked there, which is a different
 * page from one that marks nobody. Returning `{ xp: 0 }` for a signed-out reader
 * would collapse those two into one and put a "you are here" on the first rung of
 * a stranger's ladder — a value in range standing in for "there is nobody".
 */
export type ViewerXp = {
  /** The member's opaque id, for marking their own row in a list. */
  memberId: string;
  xp: number;
  standing: XpStanding;
  /** Their zone, for a date drawn in their own terms. Empty means UTC. */
  timeZone: string;
};

/** The signed-in member's standing, or null when there is no member to mark. */
export async function viewerXp(): Promise<ViewerXp | null> {
  const email = await currentEmail();
  if (email === null) return null;
  const row = await memberRowFor(email);
  if (row === null) return null;
  return {
    memberId: row.id,
    xp: row.xp,
    standing: xpStanding(row.xp),
    timeZone: row.timeZone,
  };
}
