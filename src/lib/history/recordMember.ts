import "server-only";

import { prisma } from "@/lib/prisma";
import { ownedRow } from "@/lib/rating/ownedRow";
import type { GameHistoryQuery } from "./gameHistory.types";

/**
 * The name a member's record is counted under, for a `?member=<id>` filter.
 *
 * Every count behind `GameCount` used to put the member's WHOLE NAME in the
 * address — `/history?player=Hanako%20Morris` under a row reading "Hanako M." —
 * which is the rule 0.133.0 wrote for `playerPath` and nobody carried across to
 * the other builder that puts a person in a URL. `membersNamed` in
 * `gameHistory.ts` admits the shortcoming: "a link that could not be ambiguous
 * would carry an id".
 *
 * IT RESOLVES TO A NAME RATHER THAN FILTERING ON THE ID, and that is why this is
 * a lookup and not a where-clause. A record is counted on the `Player` row, keyed
 * by the FOLDED NAME, so narrowing by the id alone would open a shorter list than
 * the number it came from. `?member=` becomes exactly `?player=<their name>`.
 *
 * The row is chosen by `ownedRow` — the same choice `fetchPlayer` makes for the
 * page that printed the count — and never left to the database, which may pick
 * either of two rows for a member who has played under two names.
 */
export async function nameForMember(memberId: string): Promise<string | null> {
  const id = memberId.trim();
  if (id === "") return null;
  const [earned, member] = await Promise.all([
    prisma.player.findMany({ where: { memberId: id }, select: { key: true, name: true, updatedAt: true } }),
    prisma.member.findUnique({ where: { id }, select: { name: true } }),
  ]);
  return ownedRow(earned, member?.name ?? "")?.name ?? member?.name ?? null;
}

/** A query with its `member` settled, and whether the id named anybody. */
export type ResolvedMember = {
  /** `member` is always null here, so nothing downstream looks it up again. */
  query: GameHistoryQuery;
  /** The address carried an id that names nobody. */
  unknown: boolean;
  /** `?against=` carried an id that names nobody, beside a member that does. */
  againstUnknown: boolean;
  /** The name the other member of a pair goes by, for the chip that says so; null with no pair. */
  againstName: string | null;
};

/**
 * `?member=<id>` turned into the name it stands for — ONCE.
 *
 * AN UNKNOWN ID USED TO BE LOOKED UP THREE TIMES on one render of the record: the
 * page asked, got nobody, and handed on a query whose `member` was still set, so
 * the page read and the plain-text read each asked again. That is what `member`
 * being null afterwards is for — in both outcomes — and what `unknown` carries
 * instead, so the page can still say the filter could not be applied without
 * keeping the id around to be asked about twice more.
 */
export async function resolveMember(query: GameHistoryQuery): Promise<ResolvedMember> {
  const none = { unknown: false, againstUnknown: false, againstName: null };
  if (query.member === null) return { query, ...none };
  const memberId = query.member;
  const name = await nameForMember(memberId);
  if (name === null) return { query: { ...query, member: null, between: null }, ...none, unknown: true };
  const resolved: GameHistoryQuery = { ...query, player: name, member: null, between: null };
  /*
   * A PAIR IS TWO DIFFERENT PEOPLE. `against` naming the member themselves is
   * not a rivalry, and nothing is narrowed by it — the same silence an outcome
   * gets with no player to read it against.
   */
  if (query.against === null || query.against === memberId) return { query: resolved, ...none };
  const againstName = await nameForMember(query.against);
  if (againstName === null) return { query: resolved, ...none, againstUnknown: true };
  return {
    query: { ...resolved, between: { member: memberId, against: query.against } },
    ...none,
    againstName,
  };
}

/** What `/api/games` says to `?member=<id>` when the id names nobody. */
export function memberUnknownRefusal(id: string): string {
  return `No member has the id "${id.trim()}", so these listing filters are not valid: member.`;
}

/** What `/api/games` says to `?against=<id>` when the id names nobody. */
export function againstUnknownRefusal(id: string): string {
  return `No member has the id "${id.trim()}", so these listing filters are not valid: against.`;
}

/**
 * The resolved query alone, for a read that has not been handed one already.
 *
 * AN ID NAMING NOBODY IS THROWN, NOT DROPPED. Dropping it is what this used to
 * do, and it widened the answer to every game with nothing to say so — the
 * fault `/api/games` was answering 200 with. Both callers that can meet an
 * address resolve first and decide what to say (`RecordPage` degrades with a
 * line, the route refuses), so reaching here with an unknown id is a caller
 * that skipped that decision, and a thrown error is the honest report of it.
 * A plausible whole record would not be.
 */
export async function withMemberResolved(query: GameHistoryQuery): Promise<GameHistoryQuery> {
  const resolved = await resolveMember(query);
  if (resolved.unknown) {
    throw new Error(`Resolve ?member= before reading the record: ${memberUnknownRefusal(query.member ?? "")}`);
  }
  // Dropped silently, a pair would widen to one member's every game.
  if (resolved.againstUnknown) {
    throw new Error(`Resolve ?against= before reading the record: ${againstUnknownRefusal(query.against ?? "")}`);
  }
  return resolved.query;
}
