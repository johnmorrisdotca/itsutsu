import "server-only";

import { PRESENT_WITHIN_MS } from "@/components/live/live.constants";
import { prisma } from "@/lib/prisma";

import type { SeatsHere } from "./gameHistory.types";

/** What the one read below brings back. */
type VersionRow = {
  updatedAt: Date;
  moveCount: number;
  remarks: number;
  blackHere: boolean;
  whiteHere: boolean;
};

/**
 * Which version of a game a live board is holding, as an HTTP entity tag, and
 * which seats' players are on the site.
 *
 * A board polls, and most of those asks come back to a game where nothing has
 * happened. Each one used to read the whole game — every move, the last thirty
 * remarks, both players' names — and send it all again. This is the small
 * read that lets the route answer "nothing changed" instead: one row, three
 * numbers and two yes-or-noes.
 *
 * WHAT THE THREE NUMBERS COVER, and why nothing else is needed:
 *
 * - `updatedAt` moves on every write to the game row, and every change a board
 *   shows is one: a move and the passes it leaves owed are written in the same
 *   transaction as the row's `moveCount` and turn, as is a forfeit, a takeback,
 *   a seat taken, an offer made or answered, a resignation and a clock.
 * - `moveCount` is there as well so a write that somehow left `updatedAt`
 *   alone still cannot hide a new stone.
 * - the remarks are their own table and never touch the game row, so their
 *   count is read beside it. Remarks are only ever added, never removed or
 *   edited, so a count cannot come back to a number it has held before.
 *
 * AND WHO IS HERE, because the board asks faster while the player it waits on
 * is on the site (`POLL_FAST_MS`). A seat's player is here when their member
 * row was seen within `PRESENT_WITHIN_MS`, the game is still being played, and
 * they are not a computer player — a program is never "on the site", and its
 * moves come from the browser that asked for them. A seat with no member
 * behind it (a name, a link nobody signed in to take) is never here either.
 * It is part of the tag, so an arrival or a departure is a full answer that
 * says so, and while nobody comes or goes the answer stays a 304.
 *
 * ONE QUERY, NOT TWO. The seats' `lastSeenAt` rides the same read through two
 * joins on the member's primary key. Raw SQL because `Game` has no relation to
 * `Member` in the schema — the seat columns are plain ids — and adding one is
 * a migration for the sake of a join.
 *
 * What it does NOT cover is a player renaming themselves mid-game: the name is
 * read from the member, and the board shows the new one at the next move
 * rather than the next poll. That is the one staleness allowed, and it is a
 * name, not the position.
 */
export async function gameVersion(
  id: string,
  now: Date = new Date(),
): Promise<{ tag: string; here: SeatsHere } | null> {
  const since = new Date(now.getTime() - PRESENT_WITHIN_MS);
  const rows = await prisma.$queryRaw<VersionRow[]>`
    SELECT g."updatedAt", g."moveCount",
      (SELECT COUNT(*)::int FROM "Reaction" r WHERE r."gameId" = g.id) AS remarks,
      (g.status = 'active' AND b."botTier" IS NULL AND b."lastSeenAt" >= ${since}) IS TRUE AS "blackHere",
      (g.status = 'active' AND w."botTier" IS NULL AND w."lastSeenAt" >= ${since}) IS TRUE AS "whiteHere"
    FROM "Game" g
    LEFT JOIN "Member" b ON b.id = g."blackMemberId"
    LEFT JOIN "Member" w ON w.id = g."whiteMemberId"
    WHERE g.id = ${id}
  `;
  const row = rows[0];
  if (row === undefined) return null;
  const here = { black: row.blackHere, white: row.whiteHere };
  return { tag: versionTag(row.updatedAt, row.moveCount, row.remarks, here), here };
}

/** The tag itself, quoted as HTTP wants an entity tag to be. */
export function versionTag(updatedAt: Date, moveCount: number, remarks: number, here: SeatsHere): string {
  const present = `${here.black ? "b" : ""}${here.white ? "w" : ""}` || "n";
  return `"g${updatedAt.getTime().toString(36)}-${moveCount}-${remarks}-${present}"`;
}

/**
 * Whether a request's `If-None-Match` names this version. The header may list
 * several tags, or `*`; a weak tag (`W/"…"`) matches its strong form, as the
 * weak comparison HTTP asks for on a GET says it should.
 */
export function holdsVersion(ifNoneMatch: string | null, version: string): boolean {
  if (ifNoneMatch === null) return false;
  return ifNoneMatch
    .split(",")
    .map((tag) => tag.trim().replace(/^W\//, ""))
    .some((tag) => tag === "*" || tag === version);
}
