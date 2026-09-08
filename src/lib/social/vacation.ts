import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

/** Vacation days a member may take in a calendar year. Flat: there are no tiers here. */
export const AWAY_DAYS_A_YEAR = 3;
const DAY_MS = 86_400_000;

export type Away = { from: Date; until: Date } | null;

/** The days an away range spends, whole days, at least one. */
export function awayDays(from: Date, until: Date): number {
  return Math.max(1, Math.ceil((until.getTime() - from.getTime()) / DAY_MS));
}

/**
 * How much later a deadline falls when the player it binds is away for part
 * of the window: the overlap between the away range and the time from
 * `since` to the deadline, added on. No overlap, no grace.
 */
export function graceMs(away: Away, since: Date, deadline: Date): number {
  if (away === null) return 0;
  const overlapStart = Math.max(away.from.getTime(), since.getTime());
  const overlapEnd = Math.min(away.until.getTime(), deadline.getTime());
  const overlap = Math.max(0, overlapEnd - overlapStart);
  if (overlap === 0) return 0;
  // Pushing the deadline by the overlap may land it still inside the range; then it waits for the range to end.
  const pushed = deadline.getTime() + overlap;
  return pushed < away.until.getTime() ? away.until.getTime() - deadline.getTime() : overlap;
}

export async function fetchAway(email: string | null): Promise<Away> {
  if (email === null) return null;
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { awayFrom: true, awayUntil: true },
  });
  if (row === null || row.awayFrom === null || row.awayUntil === null) return null;
  return { from: row.awayFrom, until: row.awayUntil };
}

export type AwayOutcome = { ok: true; used: number } | { ok: false; reason: "range" | "allowance"; used: number };

/**
 * Sets or clears a member's away range. Days come off a flat yearly
 * allowance; a range that would go over it is refused, and clearing a range
 * gives its days back.
 */
export async function setAway(email: string, from: Date | null, until: Date | null): Promise<AwayOutcome> {
  const key = foldEmail(email);
  const row = await prisma.member.findUnique({
    where: { email: key },
    select: { awayFrom: true, awayUntil: true, awayDaysUsed: true, awayYear: true },
  });
  if (row === null) return { ok: false, reason: "range", used: 0 };
  const year = new Date().getUTCFullYear();
  let used = row.awayYear === year ? row.awayDaysUsed : 0;
  if (row.awayFrom !== null && row.awayUntil !== null && row.awayYear === year) {
    used = Math.max(0, used - awayDays(row.awayFrom, row.awayUntil));
  }
  if (from === null || until === null) {
    await prisma.member.update({ where: { email: key }, data: { awayFrom: null, awayUntil: null, awayDaysUsed: used, awayYear: year } });
    return { ok: true, used };
  }
  if (until.getTime() <= from.getTime()) return { ok: false, reason: "range", used };
  const days = awayDays(from, until);
  if (used + days > AWAY_DAYS_A_YEAR) return { ok: false, reason: "allowance", used };
  await prisma.member.update({
    where: { email: key },
    data: { awayFrom: from, awayUntil: until, awayDaysUsed: used + days, awayYear: year },
  });
  return { ok: true, used: used + days };
}
