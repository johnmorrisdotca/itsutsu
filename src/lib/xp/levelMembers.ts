import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

import { levelXpRange } from "./levelLadder";

/**
 * WHO IS STANDING ON ONE RUNG.
 *
 * A level's page says what the rung is called and what it cost; this is what
 * makes it a page about the site rather than about a table. "Seventeen people
 * have stood here" is the fact that turns a catalogue entry into a place.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE QUERY, AND THE INDEX THAT ANSWERS IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A level is a RANGE of XP — `xp >= from AND xp < to` — and `Member` carries
 * `@@index([xp])`, so the range is an index scan over exactly the rows that
 * match. That is the same index the leaderboard's default order uses, and it is
 * the reason a level is derived from the total rather than stored beside it:
 * there is nothing to migrate and nothing to keep in step.
 *
 * `botTier: null` EXCLUDES THE COMPUTER PLAYERS, in this query and not only in
 * `awardXp`. `XP_DESIGN.md` argues both places: the awarder is where it is TRUE
 * that a program does not climb, and a list is where it would be VISIBLE. Seven
 * of the eleven members on production are programs, all of them on level 1 at
 * zero XP, so without this the first rung of the ladder would be a page about
 * the bots.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CAPPED, AND THE CAP IS PART OF THE ANSWER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * One page, one cap, no cursor. A rung is not a list somebody pages through —
 * it is a handful of people, and the interesting thing about it is who rather
 * than how many more. So this reads at most `LEVEL_ROLL` rows and says whether
 * there were more, which the page words. A count would be a second query for a
 * number nobody asked for; "and others" is true without one, read off one row
 * further than the cap in the same way `takeFor` answers "is there a next page".
 *
 * The rung that will actually be crowded is level 1, because nobody's XP is
 * backfilled and every member starts there — which is why the cap is a cap and
 * not an assumption that a rung holds nine people.
 */

/** How many names one rung shows. */
export const LEVEL_ROLL = 40;

/** One member standing on a rung, as the page draws them. */
export type LevelMember = {
  /** Their opaque id, which is what `PlayerName` builds the link from. */
  id: string;
  name: string;
  xp: number;
};

export type LevelRoll = {
  members: LevelMember[];
  /** True when the rung holds more than the page is showing. */
  more: boolean;
};

/** The people on one rung, at most `LEVEL_ROLL` of them, programs excluded. */
export async function membersAtLevel(level: number): Promise<LevelRoll> {
  const range = levelXpRange(level);
  /*
   * No such level, so nobody is on it — and, importantly, not "everybody". An
   * absent range folded into an empty `where` would read every member on the site
   * and present them as the occupants of level 101.
   */
  if (range === null) return { members: [], more: false };

  const xp: Prisma.IntFilter = range.to === null ? { gte: range.from } : { gte: range.from, lt: range.to };

  const read = await prisma.member.findMany({
    where: { botTier: null, xp },
    select: { id: true, name: true, xp: true },
    /*
     * Highest first, so whoever is nearest the next rung is at the top — the same
     * direction the leaderboard runs, and the one that makes a rung read as part
     * of a climb. `id` breaks the tie so the list is the same list twice running;
     * most of a rung is on identical totals, and an order the database is free to
     * change is one a reader would see shuffle on reload.
     */
    orderBy: [{ xp: "desc" }, { id: "asc" }],
    // One further than the cap, so "are there more" needs no count.
    take: LEVEL_ROLL + 1,
  });

  return { members: read.slice(0, LEVEL_ROLL), more: read.length > LEVEL_ROLL };
}
