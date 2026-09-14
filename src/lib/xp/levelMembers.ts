import "server-only";

import { prisma } from "@/lib/prisma";
import type { DirectoryWho } from "@/lib/rating/directoryFilter";
import { RECORD_SCOPES, type RecordScope } from "@/lib/rating/recordScope";

import { levelXpRange } from "./levelLadder";
import { XP_WHO_DEFAULT, xpWhoWhere } from "./xpWho";
import { XP_SCOPE_COLUMN, XP_SCOPE_DEFAULT, xpRangeWhere, xpTotalIn } from "./xpScope";

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
 * A level is a RANGE of XP — `total >= from AND total < to` — over whichever
 * total the page is counting: `Member.xpEverywhere` for Everywhere, `Member.xp`
 * for Itsutsu only, each with its own index. So the range is an index scan over
 * exactly the rows that match, and a level is derived from the total rather
 * than stored beside it: there is nothing to migrate and nothing to keep in step.
 *
 * THE COMPUTER PLAYERS ARE ON A RUNG LIKE ANYONE. This query used to keep
 * `botTier: null`, so that the first rung was not a page about seven programs
 * at nought. John reversed that — "i still don't see Levels for all equally and
 * bots don't have XP" — and a program now earns from its games and stands where
 * its total puts it, Level 1 at nought like a person. Narrowing a rung to people
 * or to programs, or to Itsutsu only, is the page's filter to offer, not this
 * query's to decide.
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
 * The rung that will actually be crowded is level 1, where every member who has
 * earned little or nothing stands — which is why the cap is a cap and not an
 * assumption that a rung holds nine people.
 */

/** How many names one rung shows. */
export const LEVEL_ROLL = 40;

/** One member standing on a rung, as the page draws them. */
export type LevelMember = {
  /** Their opaque id, which is what `PlayerName` builds the link from. */
  id: string;
  name: string;
  /** The total the rung is counting them by. */
  xp: number;
  /** What of that total is credit for another site's record: nought under Itsutsu only. */
  imported: number;
};

export type LevelRoll = {
  members: LevelMember[];
  /** True when the rung holds more than the page is showing. */
  more: boolean;
};

/** The players on one rung, at most `LEVEL_ROLL` of them — everyone, or the narrowing asked for. */
export async function membersAtLevel(
  level: number,
  who: DirectoryWho = XP_WHO_DEFAULT,
  scope: RecordScope = XP_SCOPE_DEFAULT,
): Promise<LevelRoll> {
  const range = levelXpRange(level);
  /*
   * No such level, so nobody is on it — and, importantly, not "everybody". An
   * absent range folded into an empty `where` would read every member on the site
   * and present them as the occupants of level 101.
   */
  if (range === null) return { members: [], more: false };

  const read = await prisma.member.findMany({
    where: { AND: [xpRangeWhere(scope, range), xpWhoWhere(who)] },
    select: { id: true, name: true, xp: true, xpEverywhere: true, xpImported: true },
    /*
     * Highest first, so whoever is nearest the next rung is at the top — the same
     * direction the leaderboard runs, and the one that makes a rung read as part
     * of a climb. `id` breaks the tie so the list is the same list twice running;
     * most of a rung is on identical totals, and an order the database is free to
     * change is one a reader would see shuffle on reload.
     */
    orderBy: [{ [XP_SCOPE_COLUMN[scope]]: "desc" }, { id: "asc" }],
    // One further than the cap, so "are there more" needs no count.
    take: LEVEL_ROLL + 1,
  });

  return {
    members: read.slice(0, LEVEL_ROLL).map((row) => ({
      id: row.id,
      name: row.name,
      xp: xpTotalIn(row, scope),
      imported: scope === RECORD_SCOPES.everywhere ? row.xpImported : 0,
    })),
    more: read.length > LEVEL_ROLL,
  };
}
