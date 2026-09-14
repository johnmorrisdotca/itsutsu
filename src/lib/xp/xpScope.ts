import type { Prisma } from "@prisma/client";

import { RECORD_SCOPES, RECORD_SCOPE_LIST, type RecordScope } from "@/lib/rating/recordScope";

/**
 * HOW MUCH EXPERIENCE A TOTAL COUNTS: EVERYWHERE, OR ITSUTSU ONLY.
 *
 * John, 2026-09-14: people imported from other sites "should get that XP! but of
 * course, we will show filters, that show worldwide XP with a justification that
 * they have put in their time or mileage on other sites) and the Itsutsu only XP
 * as well".
 *
 * The same two answers the players page gives about a record — the same words,
 * the same chips, the same values — because they are the same question asked of
 * a different figure. Everywhere is `Member.xpEverywhere`, the experience earned
 * here plus the credit for another site's record; Itsutsu only is `Member.xp`.
 *
 * Carried the way the board's `who` is: in the query, never the path, with no
 * redirect, and remembered on the board's own key (`xpScope`), so choosing
 * Itsutsu only on the board never changes what /players counts.
 */

export const XP_SCOPE_PARAM = "scope";

/** Everywhere, as the players page opens. */
export const XP_SCOPE_DEFAULT: RecordScope = RECORD_SCOPES.everywhere;

/** The two totals a member row carries. */
export type XpTotals = { xp: number; xpEverywhere: number };

/** The column each scope reads, sorts and ranks by. */
export const XP_SCOPE_COLUMN: Record<RecordScope, "xp" | "xpEverywhere"> = {
  [RECORD_SCOPES.everywhere]: "xpEverywhere",
  [RECORD_SCOPES.here]: "xp",
};

/** The index behind each column, for a sort declaration that has to name one. */
export const XP_SCOPE_INDEX: Record<RecordScope, string> = {
  [RECORD_SCOPES.everywhere]: "Member_xpEverywhere_idx",
  [RECORD_SCOPES.here]: "Member_xp_idx",
};

/** The scope the address asks for, or null where it says nothing this board offers. */
export function askedXpScope(query: Record<string, string | string[] | undefined>): RecordScope | null {
  const raw = query[XP_SCOPE_PARAM];
  const one = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  return (RECORD_SCOPE_LIST as readonly string[]).includes(one) ? (one as RecordScope) : null;
}

/** One member's total, as a scope counts it. */
export function xpTotalIn(member: XpTotals, scope: RecordScope): number {
  return member[XP_SCOPE_COLUMN[scope]];
}

/**
 * WHICH TOTAL THE LEVEL BADGE BESIDE A NAME IS READ FROM, EVERYWHERE ON THE SITE.
 *
 * One constant, so the badge on the members list, a ladder, a game's standings,
 * the champions, a person's page and a toast's "level up" cannot disagree about
 * a person — and the directory's XP order reads the same column (see
 * `directory.sort.ts`), so a table sorts by the number it prints.
 *
 * EVERYWHERE, because the players page counts a record everywhere by default and
 * a badge that ignored another site's credit would contradict the record beside
 * it. The XP board and the rungs, which exist to rank by experience, offer the
 * choice. FLAGGED FOR JOHN: changing this to Itsutsu only is this one line.
 */
export const XP_BADGE_SCOPE: RecordScope = RECORD_SCOPES.everywhere;

/** The total a level badge and an XP column show for this member. */
export function xpForBadge(member: XpTotals): number {
  return xpTotalIn(member, XP_BADGE_SCOPE);
}

/** Who has anything to rank under a scope: a range on its indexed column. */
export function xpOnBoardWhere(scope: RecordScope): Prisma.MemberWhereInput {
  return { [XP_SCOPE_COLUMN[scope]]: { gt: 0 } };
}

/** The members above a total, for a rank: one count on the indexed column. */
export function xpAboveWhere(scope: RecordScope, total: number): Prisma.MemberWhereInput {
  return { [XP_SCOPE_COLUMN[scope]]: { gt: total } };
}

/** The members standing on one rung under a scope. */
export function xpRangeWhere(scope: RecordScope, range: { from: number; to: number | null }): Prisma.MemberWhereInput {
  const within: Prisma.IntFilter = range.to === null ? { gte: range.from } : { gte: range.from, lt: range.to };
  return { [XP_SCOPE_COLUMN[scope]]: within };
}

/**
 * The address for a chip: the page's other choices kept — the who, the sort —
 * the cursor and the count-from dropped, since a board counted another way
 * starts at its own first page and a cursor from one ordering means nothing in
 * the other. Always names the scope, Everywhere included, so following the chip
 * is the address SAYING it, which is what gets it remembered.
 */
export function xpScopeHref(at: string, query: string, scope: RecordScope): string {
  const params = new URLSearchParams(query);
  params.delete("cursor");
  params.delete("from");
  params.set(XP_SCOPE_PARAM, scope);
  return `${at}?${params.toString()}`;
}
