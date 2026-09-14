import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { PROVISIONAL_BELOW, UNRATED_BELOW } from "./elo";
import { playerKey } from "./playerKey";

/**
 * A rating row whose SHOWN rating has settled — the one `ratingShown` prints
 * beside a name, with the tier `tierShown` prints beside that.
 *
 * The members list prints the ladder rating where a person has one (four
 * rated games among people), and otherwise the rating earned against the
 * computer players, marked as such. So "settled" is: twenty games among
 * people; or, with fewer than four there, twenty against the programs.
 *
 * This asked about the ladder alone until 0.187.3, on the reasoning that the
 * old `PlayerProfile.tier` was the ladder's — written before the rating column
 * learned to show the other pool. It left out every computer player, whose
 * settled rating the list prints, and every person who has only played them.
 * On a site where nobody has twenty games against another person yet that is
 * everybody, which is how John's list read "0 of 11 listed". The precedence
 * is checked against `tierShown` at every boundary by `directorySettled.test.ts`.
 */
export const SETTLED_AS_SHOWN: Prisma.PlayerWhereInput = {
  OR: [
    { ratedGames: { gte: PROVISIONAL_BELOW } },
    { ratedGames: { lt: UNRATED_BELOW }, computerRatedGames: { gte: PROVISIONAL_BELOW } },
  ],
};

/**
 * WHICH MEMBERS HAVE A SETTLED RATING, AS A LIST OF IDS.
 *
 * The directory's "Settled ratings" narrowing is the one filter of the three
 * that cannot be a `WHERE` clause on `Member`. `who` is `botTier`, `active` is
 * `lastSeenAt`, and both go straight into the read. This one asks about a
 * TIER — twenty rated games or more — which is derived from a column on
 * `Player`, a table with no relation to `Member` by design, reached by the
 * member's id where a rating is bound to one and by their FOLDED NAME where it
 * is not.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY IT IS AN ID LIST AND NOT A FILTER OVER THE PAGE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Narrowing after the page is read is the bug this whole convention exists to
 * remove, one layer along: a page of fifty rows filtered down to three still
 * hands out a cursor saying there is more, and the reader is shown three rows
 * and told the list has six hundred. The narrowing has to reach the query, so
 * the question is answered FIRST and handed over as `id IN (…)` — which pages
 * and sorts by the ordinary keyset like any other `where`.
 *
 * It is affordable because the set is decided by a tiny table. `Player` holds
 * nine rows on production and eight of them are established; on a development
 * database eight of three thousand clear twenty rated games. So the list is
 * short, and the reads that build it are short with it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE PRECEDENCE IS `toDirectory`'S, NOT A SECOND VERSION OF IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A row's profile is `byMember.get(id) ?? byKey.get(playerKey(name))` — the
 * member's own rating row wins, and the name answers only where there is none.
 * That matters here and is easy to get wrong in the flattering direction: a
 * member whose bound rating row is unrated, but whose OLD name happens to key
 * an established row somebody else earned, must not be listed as settled. The
 * directory would show them a dash for a rating under a filter that says
 * settled, which reads as a broken filter rather than as an answer.
 *
 * So: bound rows first, and a name match counts only for a member who has no
 * bound row at all. Three small reads, and only when the filter is asked for —
 * `fetchDirectoryPage` does not call this otherwise.
 */
export async function membersWithSettledRatings(): Promise<string[]> {
  const established = await prisma.player.findMany({
    where: SETTLED_AS_SHOWN,
    select: { key: true, name: true, memberId: true },
  });
  if (established.length === 0) return [];

  const bound = established
    .map((row) => row.memberId)
    .filter((id): id is string => id !== null && id !== "");
  const loose = established.filter((row) => row.memberId === null || row.memberId === "");
  if (loose.length === 0) return [...new Set(bound)];

  /*
   * The members an unbound established row might belong to.
   *
   * FOLDED IN MEMORY, AND THE DATABASE NARROWS NOTHING — which is not laziness,
   * it is the only way round that is correct. `playerKey` does more than
   * lower-case: it collapses runs of whitespace, so the rating row earned as
   * "Hanako   Morris" is keyed `hanako morris`. A case-insensitive `name IN
   * (…)` against the raw names therefore MISSES it, silently, and the member
   * drops out of a filter that should list her. A test written before this code
   * was believed caught exactly that.
   *
   * `memberIdForName` in `players.ts` has answered the same question the same
   * way since the ratings were first bound to accounts, and this is two columns
   * over a table with twenty rows on production and six hundred on a
   * development database — read only when somebody asked for settled ratings,
   * and only when an established rating has nobody bound to it.
   */
  const keys = new Set(loose.map((row) => playerKey(row.key)));
  const candidates = await prisma.member.findMany({ select: { id: true, name: true } });
  const named = candidates.filter((member) => keys.has(playerKey(member.name)));
  if (named.length === 0) return [...new Set(bound)];

  /*
   * A member reached only by name does not qualify if they have a rating row of
   * their own, because that row is the one the page would show — and what it
   * shows has not settled, or it would already be in `bound`.
   */
  const haveTheirOwn = await prisma.player.findMany({
    where: { memberId: { in: named.map((member) => member.id) } },
    select: { memberId: true },
  });
  const owned = new Set(haveTheirOwn.map((row) => row.memberId));
  return [...new Set([...bound, ...named.map((one) => one.id).filter((id) => !owned.has(id))])];
}
