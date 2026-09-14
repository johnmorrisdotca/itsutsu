import "server-only";

import { prisma } from "@/lib/prisma";

import { xpShown, type StandingOf } from "./levelShown";

/**
 * THE XP TOTAL FOR A PAGE OF RATING ROWS, IN ONE READ.
 *
 * John's rule for the stats tables was that every one of them shows XP, and it
 * came with a "why": *"why are some pages now showing it???"* The tables that
 * did not were the ones built from RATING rows — the site ladder is `Player`
 * rows and a game's standings are `PlayerVariantRating` rows, both keyed by the
 * folded name a record was earned under — and XP lives on `Member`. Those
 * tables read no member row at all, so the column had nothing to fill it from.
 *
 * This is the read that fills it, and its shape is the whole point:
 *
 * - **ONE QUERY PER PAGE, NEVER ONE PER ROW.** It takes every `memberId` a page
 *   of rows carries and asks for those members' totals in a single `IN`, the
 *   same way `fetchPlayedTallies` counts a page of programs' games and
 *   `toDirectory` finds a page of members' ratings. A ladder page is twenty-five
 *   rows; this is one round trip, keyed on `Member.id`, selecting two columns.
 * - **THE RULE IS `xpShown`, NOT THE COLUMN.** The member is handed to
 *   `levelShown.ts` to decide what its total shows — a nought is a nought, a
 *   total that is not a number is nothing — rather than this deciding again
 *   here. A program is a member like anyone: its total is its total.
 * - **A NAME WITH NOBODY BEHIND IT IS ABSENT FROM THE MAP.** A rating row whose
 *   `memberId` is null was earned by a name typed into a game at one screen and
 *   never claimed, or by a kept record from another site. There is no total to
 *   be had for such a row, and the table says so with a dash and a reason —
 *   see `xpBlankBecause` on `RecordTableRow` — rather than with a nought that
 *   would claim a person had earned nothing.
 *
 * `LadderMore.tsx` used to decline the column on the argument that the figure
 * would be "a SECOND read per page" and might show one person's total beside
 * two names after a rename. The first is true and is the price of a column the
 * site's owner asked for by name; it is one bounded read, not a query per row.
 * The second is not a fault: two rating rows that belong to one member ARE one
 * person, and their total beside each is the truth about that person twice.
 */

/** What this read selects: enough to hand to `xpShown` and nothing more. */
type MemberStanding = { id: string } & StandingOf;

/**
 * `memberId → xpShown(member)` for every member among `memberIds`, in one query.
 *
 * Absent from the map for an id that matched no member, and for a null id.
 * `null` in the map means the member exists and has no standing — a program.
 */
export async function xpByMemberId(
  memberIds: readonly (string | null | undefined)[],
): Promise<Map<string, number | null>> {
  const ids = [...new Set(memberIds.filter((id): id is string => typeof id === "string" && id !== ""))];
  if (ids.length === 0) return new Map();
  const members: MemberStanding[] = await prisma.member.findMany({
    where: { id: { in: ids } },
    select: { id: true, xp: true },
  });
  return standingsOf(members);
}

/**
 * The pure half: a map from each member's id to what their XP column shows.
 *
 * Split out so the rule can be unit-tested without a database — the query
 * above is `findMany` with a `select`, and everything worth asserting is here.
 */
export function standingsOf(members: readonly MemberStanding[]): Map<string, number | null> {
  return new Map(members.map((member) => [member.id, xpShown(member)]));
}
