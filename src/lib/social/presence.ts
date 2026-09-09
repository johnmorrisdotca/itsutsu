import "server-only";

import { prisma } from "@/lib/prisma";

/** How recently a member was seen, in the three bands the list marks. */
export type Recency = "now" | "recent" | "today" | null;

export const RECENCY_MINUTES = { now: 5, recent: 15, today: 30 } as const;

/**
 * How many of them the list will name.
 *
 * "Who is here" is a half hour's worth of members, which is a number this
 * site has no control over: it grows with how well the site does and with
 * anybody who opens a lot of tabs. A page that reads every row of a table
 * whose size is somebody else's decision is the shape of thing that costs
 * money by accident, so it stops at a hundred — far more names than anyone
 * reads, and a ceiling either way.
 */
const HERE_MAX = 100;

export function recencyOf(lastSeenAt: Date, now = new Date()): Recency {
  const minutes = (now.getTime() - lastSeenAt.getTime()) / 60_000;
  if (minutes <= RECENCY_MINUTES.now) return "now";
  if (minutes <= RECENCY_MINUTES.recent) return "recent";
  if (minutes <= RECENCY_MINUTES.today) return "today";
  return null;
}

export type HereNow = {
  /** Null for a kept record: somebody who never signed in. */
  email: string | null;
  name: string;
  picture: string;
  lastSeenAt: string;
  recency: Recency;
  timeZone: string;
  /** The member's own clock, if they said where they are. */
  localTime: string | null;
};

/** The member's wall-clock time in their zone, or null when the zone is unset or unknown. */
export function localTimeIn(timeZone: string, now = new Date()): string | null {
  if (timeZone === "") return null;
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(now);
  } catch {
    return null;
  }
}

/**
 * Who is here: members seen in the last half hour who let themselves be
 * listed, most recent first. "Here" is measured by the pages they load, so it
 * is a few minutes behind at most.
 */
export async function fetchHereNow(now = new Date()): Promise<HereNow[]> {
  const since = new Date(now.getTime() - RECENCY_MINUTES.today * 60_000);
  const rows = await prisma.member.findMany({
    where: { showOnline: true, lastSeenAt: { gte: since } },
    orderBy: { lastSeenAt: "desc" },
    take: HERE_MAX,
    select: { email: true, name: true, picture: true, lastSeenAt: true, timeZone: true },
  });
  return rows.map((row) => ({
    email: row.email,
    name: row.name,
    picture: row.picture,
    lastSeenAt: row.lastSeenAt.toISOString(),
    recency: recencyOf(row.lastSeenAt, now),
    timeZone: row.timeZone,
    localTime: localTimeIn(row.timeZone, now),
  }));
}
