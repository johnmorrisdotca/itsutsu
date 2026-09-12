import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The name to SHOW for a seat, which is not always the name that was played.
 *
 * A game stores the two names as they stood when it was played, and that is
 * right: the row is a record of something that happened, and a rating is earned
 * under the name it was earned under. But it means a rename never reaches
 * backwards. John's daughter renamed from "Hanako Morris" to "Hanachan" — on
 * this site's own advice, because her full name was public — and her older games
 * went on naming her the old way while her newest named her the new. Two names
 * for one child, on one board, with no way for a reader to know they were the
 * same person. Five of her games on production read that way today.
 *
 * 0.132.0 fixed the RECORD following her: her rating, her counts and her
 * standings are looked up by `memberId` and move with her. This is the other
 * half — what a page PRINTS — and it is deliberately a different mechanism,
 * because the two must not be confused:
 *
 * - **Identity is an id.** Which person a seat belongs to is `blackMemberId`,
 *   and that is what this resolves through.
 * - **A rating is a name it was earned under.** `recordResult`, `ratingRefusal`
 *   and the `Player` table all read raw database rows and must go on doing so.
 *   Resolving a name there would move a rating out from under the person who
 *   earned it, and `GameSummary.playedAs` is what those callers read instead.
 *
 * The seam between them is `toSummary`: raw rows go in, display objects come
 * out, and the resolution happens exactly there. Nothing downstream has to
 * remember, and no write path is touched.
 */

/** Current display names, by member id. */
export type CurrentNames = ReadonlyMap<string, string>;

/**
 * For the callers that genuinely have nobody to resolve — a position handed to
 * the engine, which reads no names at all, or a test about the stored name
 * itself.
 *
 * Named rather than written as `new Map()` at the call site, so that "I know of
 * no member here" is a statement somebody made rather than an argument somebody
 * left empty.
 */
export const NO_CURRENT_NAMES: CurrentNames = new Map();

/**
 * The name a seat should be shown under: the member's current one where the seat
 * is bound to a member we have a name for, and otherwise exactly what was
 * stored.
 *
 * The fallback is the important half. Most seats on this site have no account
 * behind them — a name typed into a game at one screen, a record kept from
 * another site — and those are not lesser rows to be apologised for. They are
 * most of the table, and the stored name is the only name they have.
 */
export function seatName(stored: string, memberId: string | null, names: CurrentNames): string {
  if (memberId === null) return stored;
  return names.get(memberId) ?? stored;
}

/** The two columns this needs off a game row, whatever else the caller selected. */
type Seats = { blackMemberId: string | null; whiteMemberId: string | null };

/**
 * Current names for every member id among these seats, in one query.
 *
 * Takes the rows rather than a list of ids so a caller cannot accidentally ask
 * about one seat and forget the other — the commonest way a half-applied fix
 * leaves one side of a board reading the old name.
 *
 * A page of games mentions a handful of people, so this is one small indexed
 * read per page and not one per row; `openGames.ts` reads poster countries the
 * same way for the same reason. An empty ask makes no query at all.
 */
export async function currentNamesFor(seats: readonly Seats[]): Promise<CurrentNames> {
  const ids = new Set<string>();
  for (const seat of seats) {
    if (seat.blackMemberId !== null) ids.add(seat.blackMemberId);
    if (seat.whiteMemberId !== null) ids.add(seat.whiteMemberId);
  }
  if (ids.size === 0) return NO_CURRENT_NAMES;

  const members = await prisma.member.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true },
  });
  const names = new Map<string, string>();
  for (const member of members) {
    const name = member.name.trim();
    /*
     * A member with a blank name resolves to nothing, so the stored name stands
     * rather than a seat going nameless. "" is a column that was never filled
     * in, not a person who is called nothing, and the two must not be shown
     * alike.
     */
    if (name !== "") names.set(member.id, name);
  }
  return names;
}
